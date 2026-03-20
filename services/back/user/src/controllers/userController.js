const userModel = require('../models/userModel');
const fs = require("fs");
const { pipeline } = require("stream/promises");
const path = require("path");
const logoutWsHub = require("../ws/logoutWsHub.js");

const ACHIEVEMENT_DEFS = [
	{ key: 'first_match', metric: 'total_matches', target: 1, points: 10 },
	{ key: 'regular_player', metric: 'total_matches', target: 10, points: 30 },
	{ key: 'winning_start', metric: 'wins', target: 3, points: 25 },
	{ key: 'sharp_shooter', metric: 'correct', target: 25, points: 35 },
	{ key: 'high_scorer', metric: 'total_score', target: 1500, points: 35 },
	{ key: 'accuracy_pro', metric: 'accuracy', target: 70, points: 40 },
];

async function getUsers() {
	const users = await userModel.findAllUsers();
	if (!users) {
		throw new Error("Users database is empty");
	}
	return users;
}

async function getUser(username, password) {
	return await userModel.findUser(username, password);
}

async function getUserById(id) {
	const user = await userModel.findUserById(id);
	if (!user) {
		throw new Error('User not found');
	}
	return user;
}

async function getUserByUsername(username) {
	const user = await userModel.findUserByUsername(username);
	if (!user)
		throw new Error('User not found');
	return user;
}

async function updateUser(userId, updateData) {
	const update = await userModel.updateUserById(userId, updateData);
	if (!update) {
		throw new Error('User not found or update failed');
	}
	return update;
}

async function updateAvatar(userId, data) {
	if (!["image/png", "image/jpeg", "image/gif"].includes(data.mimetype)) {
		throw new Error("Invalid file type, only PNG, JPEG and GIF are allowed");
	}
	const ext = data.mimetype === "image/png"
		? "png"
		: data.mimetype === "image/gif"
			? "gif"
			: "jpg";
	const fileName = `${userId}-${Date.now()}.${ext}`;
	const filePath = `/uploads/user/avatars/${fileName}`;

	const uploadDir = path.join(__dirname, "../../uploads/user/avatars");
	if (!fs.existsSync(uploadDir)) {
		fs.mkdirSync(uploadDir, { recursive: true });
	}

	const outputPath = path.join(uploadDir, fileName);
	await pipeline(data.file, fs.createWriteStream(outputPath));

	await updateUser(userId, { avatarUrl: filePath });
	return { message: "Avatar uploaded", avatarUrl: filePath };
}

async function getRecentMatchesByUserId(userId, limit) {
	const matches = await userModel.findRecentMatchesByUserId(userId, limit);
	return matches || [];
}

async function getUserStatsById(userId)
{
	if (!Number(userId) || userId <= 0)
		throw new Error("Invalid user ID");
	const user = await getUserById(userId);
	if (!user)
		throw new Error("User not found");
	const stats = userModel.findUserStatsById(userId);
	if (!stats)
		throw new Error("User stats not found");
	return stats;
}

async function getUserAchievementsById(userId)
{
	if (!Number(userId) || userId <= 0)
		throw new Error("Invalid user ID");
	const user = await getUserById(userId);
	if (!user)
		throw new Error("User not found");

	const stats = userModel.findUserStatsById(userId) || {};
	const metrics = {
		total_matches: Number(stats.total_matches || 0),
		wins: Number(stats.wins || 0),
		total_score: Number(stats.total_score || 0),
		correct: Number(stats.correct || 0),
		accuracy: Number(stats.accuracy || 0),
	};

	const all = ACHIEVEMENT_DEFS.map((def) => {
		const value = Number(metrics[def.metric] || 0);
		const clampedProgressValue = Math.min(value, def.target);
		const progressPercent = def.target > 0
			? Math.max(0, Math.min(100, Math.round((clampedProgressValue / def.target) * 100)))
			: 0;
		const unlocked = value >= def.target;
		return {
			key: def.key,
			metric: def.metric,
			target: def.target,
			value,
			progressPercent,
			unlocked,
			points: def.points,
		};
	});

	const unlocked = all.filter((item) => item.unlocked);
	const inProgress = all
		.filter((item) => !item.unlocked)
		.sort((a, b) => b.progressPercent - a.progressPercent)
		.slice(0, 3);

	const totalPoints = all.reduce((sum, item) => sum + item.points, 0);
	const unlockedPoints = unlocked.reduce((sum, item) => sum + item.points, 0);
	const progressPercent = totalPoints > 0 ? Math.round((unlockedPoints / totalPoints) * 100) : 0;

	return {
		summary: {
			unlockedCount: unlocked.length,
			totalCount: all.length,
			unlockedPoints,
			totalPoints,
			progressPercent,
		},
		unlocked,
		inProgress,
		all,
	};
}

async function getWinsLeaderboard(limit = 5)
{
	const safeLimit = Math.max(1, Math.min(Number(limit) || 5, 10));
	const rows = userModel.findWinsLeaderboard(safeLimit) || [];
	return rows.map((row) => ({
		id: Number(row.id),
		username: String(row.username || ''),
		wins: Number(row.wins || 0),
	}));
}

async function deleteUser(userId) {
	const res = await userModel.deleteUserById(userId);
	if (!res || res.changes === 0)
		throw new Error("User does not exist");
	
	logoutWsHub.broadcast(userId, {type: 'logout', payload: { userId } });
	return res;
}

async function isUserInAGame(userId) {
	const user = await userModel.findUserInAGame(userId);
	if (!user) {
		return false;
	}
	return true;
}

module.exports = {
	getUsers,
	getUserById,
	getUserByUsername,
	updateUser,
	updateAvatar,
	getUser,
	getRecentMatchesByUserId,
	getUserStatsById,
	getUserAchievementsById,
	getWinsLeaderboard,
	deleteUser,
	isUserInAGame
};
