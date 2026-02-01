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
		user.password = await bcrypt.hash(request.body.password, saltWorkFactor);
		try {
			const transporter = nodemailer.createTransport({
				host: 'smtp.ethereal.email',
				port: 587,
				auth: {
					user: user.email,
					pass: pass
				}
			});
			
			const response = await authModel.addNewUser(user);
			if (response.ok) {
				facode = Math.random() * (999999 - 100000) + 100000;
				(async () => {
					const info = await transporter.sendMail({
						from: '"toto" <ft_trans@ethereal.email>',
						to: user.email,
						subject: "Your authentication code ✔",
						html: `<b>Hello ${user.username}, here is your code: ${Math.round(facode)}</b>`
					});
					console.log("📨 Message sent:", user.email);
					console.log("🔗 Message received:", nodemailer.getTestMessageUrl(info))
				})();
			} else {
				const errmsg = await response.json();
				return reply.code(404).send(errmsg);
			}
		} catch (error) {
			console.error(error);
		}
		return reply.code(200).send({ok:true, message: "User registered, check your email for the code."});
}

async function codeVerification(frontAuth) {
	const code = Math.round(facode);
	console.log("front authentication:", frontAuth);
	console.log("back authentication:", code.toString());
	if (code != frontAuth)
		return { ok:false, err: "Bad authentication code" };
	return { ok:true, message: "Code verified successfully" };
}


module.exports = {
	signupUser,
	codeVerification
};