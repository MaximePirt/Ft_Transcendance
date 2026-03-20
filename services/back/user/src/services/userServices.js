const nodemailer = require("nodemailer");


const usermail = process.env.USERMAIL || false;
if (!usermail) {
    console.error("USERMAIL environment variable is not set.");
    process.exit(1);
}
const usermailPass = process.env.USERMAIL_PASS || false;
if (!usermailPass) {
    console.error("USERMAIL_PASS environment variable is not set.");
    process.exit(1);
}

function createZohoTransporter() {
    return nodemailer.createTransport({
        host: "smtp.zoho.eu",
        port: 587,
        secure: false,
        auth: {
            user: usermail,
            pass: usermailPass,
        },
    });
}

module.exports = { createZohoTransporter };