const authModel = require('../models/authModel');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');


function User(username, email, password, token) {
	this.username = username;
	this.email = email;
	this.password = password;
	this.token = token;
	this.id = 0;
}

const saltWorkFactor = 12;
let facode = 0;

async function signupUser(request, reply) {
	const user = Object.create(User);
	user.username = await request.body.username;
	user.email = await request.body.email;
	const pass = await request.body.password;
	user.password = await bcrypt.hash(pass, saltWorkFactor);
	try {
		const response = authModel.addNewUser(user);
		if (!response) {
			return reply.code(404);
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
	const hashPass = await bcrypt.hash(pass, saltWorkFactor);
	const resp = authModel.getUserId(rep, email, hashPass);
	if (!resp)
		return rep.code(401).send({ error: 'Invalid credentials' })
	else
		return resp;
}

async function getUsername(req, rep) {
	const username = authModel.getUserName(req, rep)
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


module.exports = {
	signupUser,
	loginUser,
	getUsername,
	codeVerification
};
