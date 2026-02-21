import { addNewUser, getUserName, getUserId } from '../models/authModel.js'

function User(username, email, password, token) {
	this.username = username;
	this.email = email;
	this.password = password;
	this.token = token;
	this.id = 0;
}

let facode = 0;

async function signupUser(request, reply) {
	const user = Object.create(User);
	user.username = await request.body.username;
	user.email = await request.body.email;
	user.password = await request.body.password;
	try {
		const response = addNewUser(user);
		if (!response) {
			return reply.code(404).send({ error: response.error })
		}
		console.log("response: ", response)
		return response;
	} catch (error) {
		console.error(error);
	}
}

async function loginUser(hashPass, req, rep) {
	const pass = await req.body.password;
	const email = await req.body.email;
	const resp = getUserId(rep, email, pass);

	if (!resp)
		return rep.code(401).send({ error: resp.error })
	else {
		return resp;
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
	codeVerification
};
