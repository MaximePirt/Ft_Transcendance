const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");
const redis = require("redis");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const Joi = require("joi");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3003;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Redis connection
const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});
redisClient.connect();

// Middleware
app.use(express.json());

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  twoFactorToken: Joi.string().length(6).optional(),
});

// Register endpoint
app.post("/api/register", async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { username, email, password } = value;

    // Check if user exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, created_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING id, username, email, created_at`,
      [username, email, hashedPassword]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, twoFactorToken } = value;

    // Get user
    const result = await pool.query(
      "SELECT id, username, email, password_hash, two_factor_secret FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check 2FA if enabled
    if (user.two_factor_secret) {
      if (!twoFactorToken) {
        return res.status(200).json({
          requiresTwoFactor: true,
          message: "Two-factor authentication required",
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: "base32",
        token: twoFactorToken,
        window: 2,
      });

      if (!verified) {
        return res.status(401).json({ error: "Invalid two-factor token" });
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Store session in Redis
    await redisClient.setEx(`session:${user.id}`, 86400, token);

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Setup 2FA
app.post("/api/2fa/setup", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `ft_transcendence (${req.headers["x-user-email"]})`,
      issuer: "ft_transcendence",
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store temporary secret (not activated yet)
    await redisClient.setEx(`2fa_setup:${userId}`, 300, secret.base32);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32,
    });
  } catch (error) {
    console.error("2FA setup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify and enable 2FA
app.post("/api/2fa/verify", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { token } = req.body;

    if (!token || token.length !== 6) {
      return res.status(400).json({ error: "Invalid token format" });
    }

    // Get temporary secret
    const secret = await redisClient.get(`2fa_setup:${userId}`);
    if (!secret) {
      return res
        .status(400)
        .json({ error: "2FA setup expired. Please start over." });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: "base32",
      token: token,
      window: 2,
    });

    if (!verified) {
      return res.status(401).json({ error: "Invalid token" });
    }

    // Save secret to database
    await pool.query("UPDATE users SET two_factor_secret = $1 WHERE id = $2", [
      secret,
      userId,
    ]);

    // Clean up temporary secret
    await redisClient.del(`2fa_setup:${userId}`);

    res.json({ message: "2FA enabled successfully" });
  } catch (error) {
    console.error("2FA verify error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Logout endpoint
app.post("/api/logout", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    // Remove session from Redis
    await redisClient.del(`session:${userId}`);

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "auth-service",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});
