const React = require("react");
const {
	Body,
	Container,
	Head,
	Html,
	Img,
	Preview,
	Section,
	Text,
} = require("@react-email/components");

const bodyStyle = {
	backgroundColor: "#ffffff",
	color: "#24292e",
	fontFamily:
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
	margin: 0,
	padding: 0,
};

const containerStyle = {
	maxWidth: "480px",
	margin: "0 auto",
	padding: "20px 0 48px",
};

const titleStyle = {
	fontSize: "24px",
	lineHeight: "1.25",
	marginBottom: "16px",
};

const paragraphStyle = {
	margin: "0 0 10px 0",
	textAlign: "left",
	fontSize: "14px",
};

const paragraphStyle2 = {
	margin: "0 0 10px 0",
	textAlign: "center",
	fontSize: "14px",
};

const boxStyle = {
	padding: "12px",
	border: "1px solid #dedede",
	borderRadius: "5px",
	textAlign: "center",
};

const codeStyle = {
	fontSize: "24px",
	lineHeight: "1.25",
	marginBottom: "16px",
	textAlign: "center",
};

const warningStyle = {
	padding: "20px",
	margin: "0 0 10px 0",
	fontSize: "10px",
	textAlign: "center",
};

function SigninValidationEmail({ username, code }) {
	return React.createElement(
		Html,
		null,

		React.createElement(Head, null),

		React.createElement(
			Preview,
			null,
			`Here's your code, ${username} !`
		),

		React.createElement(
			Body,
			{ style: bodyStyle },

			React.createElement(
				Container,
				{ style: containerStyle },

				React.createElement(Img, {
					src: "https://github.com/Rockmard/ft_publicFiles/blob/main/RoundedDefault.png?raw=true",
					width: "32",
					height: "32",
					alt: "Logo",
				}),

				React.createElement(
					Text,
					{ style: titleStyle },
					"Hi ",
					React.createElement("strong", null, username),
					","
				),

				React.createElement(
					Text,
					{ style: paragraphStyle },
					"Welcome back to Quiz Sprint."
				),

				React.createElement(
					Section,
					{ style: boxStyle },

					React.createElement(
						Text,
						{ style: paragraphStyle2 },
						"Here is your code"
					),

					React.createElement(
						Text,
						{ style: codeStyle },
						React.createElement("strong", null, code)
					)
				),

				React.createElement(
					Text,
					{ style: warningStyle },
					"If you did not initiate this request, ignore this email."
				)
			)
		)
	);
}

module.exports = SigninValidationEmail;
