import { addNewUser, getUserName, getModelUserId, getUserModelEmail } from '../models/authModel.js'

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

async function codeVerification(frontAuth) {
	const code = Math.round(facode);
	if (code != frontAuth)
		return { ok: false, err: "Bad authentication code" };
	return { ok: true, message: "Code verified successfully" };
}


export {
	signupUser,
	loginUser,
	getUsername,
	codeVerification,
	getUserByEmail,
	getUserId
};
