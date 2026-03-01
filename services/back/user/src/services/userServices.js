const nodemailer = require("nodemailer");

// TODO: Mettre le host, port, user, et pass et ENV
function createZohoTransporter() {
    return nodemailer.createTransport({
        host: "smtp.zoho.eu",
        port: 587,
        secure: false,
        auth: {
            user: "ft_trans@zohomail.eu",
            pass: "SF#caV9t'XG5qB3",
        },
    });
}

module.exports = { createZohoTransporter };