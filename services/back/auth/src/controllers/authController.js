import { addNewUser, getUserName, getUserId, getUserModelEmail, getSignupAvailability } from '../models/authModel.js'

function User(username, email, password, token) {
	this.username = username;
	this.email = email;
	this.password = password;
	this.token = token;
	this.id = 0;
}

async function signupUser(email, username, password) {
	const response = addNewUser(username, email, password);
	if (response === "MISSING_FIELDS") {
		throw new Error("MISSING_FIELDS");
	} else if (response === "INVALID_CREDENTIALS") {
		throw new Error("INVALID_CREDENTIALS");
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

async function checkSignupAvailability(email, username) {
	if (!email || !username) {
		throw new Error('MISSING_FIELDS');
	}
	return getSignupAvailability(email, username);
}

async function getUsername(email) {
	const username = getUserName(email);
	if (!username)
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
	checkSignupAvailability
};
