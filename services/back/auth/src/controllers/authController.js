import { addNewUser, getUserName, getUserId } from '../models/authModel.js'

function User(username, email, password, token) {
	this.username = username;
	this.email = email;
	this.password = password;
	this.token = token;
	this.id = 0;
}

let facode = 0;

async function signupUser(data, reply) {
	const pack = JSON.parse(data);
	const user = Object.create(User);
	console.log("body: ", pack);
	user.username = pack.username;
	user.email = pack.email;
	user.password = pack.password;
	try {
		const response = addNewUser(user);
		if (!response) {
			return reply.code(404).send({ error: "Error when sign up" })
		}
		console.log("response: ", response)
		return response;
	} catch (error) {
		console.error(error);
	}
}

async function loginUser(req, rep) {
	const pass = await req.body.password;
	const email = await req.body.email;
	const resp = getUserId(email, pass);

	if (!resp)
		return rep.code(401).send({ error: resp.error })
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

async function getUsername(req, rep) {
	const username = getUserName(req, rep)
	if (!username)
		return rep.code(401).send({ error: "Invalid credentials" })
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

};
