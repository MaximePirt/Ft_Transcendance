import nodemailer from "nodemailer";

function createZohoTransporter() {
	return nodemailer.createTransport({
		host: "smtp.zoho.eu",
		port: 587,
		secure: false,
		auth: {
			user: "ft_trans@zohomail.eu",
			pass: "SF#caV9tXG5qB3",
		},
	});
}

export { createZohoTransporter };
