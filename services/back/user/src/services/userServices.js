const nodemailer = require("nodemailer");

function createZohoTransporter() {
    return nodemailer.createTransport({
        host: "smtp.zoho.eu",
        port: 587,
        secure: false,
        auth: {
            user: "ft_trans@zohomail.eu",
            pass: "SF#caV9t'XG5qB3",
        },
    });
}

module.exports = { createZohoTransporter };