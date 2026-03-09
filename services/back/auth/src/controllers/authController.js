import { addNewUser, getUserName, getModelUserId, getUserModelEmail, getUserModelAuth } from '../models/authModel.js'

async function signupUser(email, username, password) {
	const response = addNewUser(username, email, password);
	if (response === "EMAIL_EXISTS") {
		throw new Error("EMAIL_EXISTS");
	} else if (response === "DEFAULT") {
		throw new Error("DEFAULT");
	}
	return response;
}

async function loginUser(email, password) {
	const resp = await getUserId(email, password);

	if (resp === "USER_NOT_FOUND")
		throw new Error("INVALID_CREDENTIALS");
	else {
		return resp;
	}
}

async function getUserByEmail(email) {
	const user = getUserModelEmail(email);
	if (user === "USER_NOT_FOUND") {
		throw new Error("USER_NOT_FOUND");
	} else {
		return user;
	}
}

async function getUserId(email) {
	const resp = getModelUserId(email);
	if (resp === "DEFAULT")
		throw new Error("DEFAULT");
}

async function getUsername(email) {
	const username = getUserName(email);
	if (username === "INVALID_CREDENTIALS")
		throw new Error("INVALID_CREDENTIALS");
	return username;
}

async function getUserAuth(email) {
	const resp = getUserModelAuth(email);
	if (resp === "USER_NOT_FOUND")
		return "USER_NOT_FOUND";
	return resp;
}

export {
	signupUser,
	loginUser,
	getUsername,
	getUserByEmail,
	getUserId,
	getUserAuth
};
