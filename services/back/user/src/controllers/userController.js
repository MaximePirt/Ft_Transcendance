const userModel = require('../models/userModel');
const fs = require("fs");
const { pipeline } = require("stream/promises");
const path = require("path");

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

async function addUser(data) {
	return await userModel.addNewUser(data);
}

async function updateUser(userId, updateData) {
	const update = await userModel.updateUserById(userId, updateData);
	if (!update) {
		throw new Error('User not found or update failed');
	}
	return update;
}

async function updateAvatar(userId, data) {
	if (!["image/png", "image/jpeg"].includes(data.mimetype)) {
		return reply
			.code(400)
			.send({ error: "Invalid file type, only PNG and JPEG are allowed" });
	}
	const ext = data.mimetype === "image/png" ? "png" : "jpg";
	const filePath = `/uploads/avatars/${userId}-${Date.now()}.${ext}`;

	const uploadDir = path.join(__dirname, "../../uploads/avatars");
	if (!fs.existsSync(uploadDir)) {
		fs.mkdirSync(uploadDir, { recursive: true });
	}

	await pipeline(data.file, fs.createWriteStream(`.${filePath}`));

	await updateUser(userId, { avatarUrl: filePath });
	return { message: "Avatar uploaded", avatarUrl: filePath };
}

module.exports = {
	getUsers,
	getUserById,
	updateUser,
	updateAvatar,
	addUser,
	getUser
};
