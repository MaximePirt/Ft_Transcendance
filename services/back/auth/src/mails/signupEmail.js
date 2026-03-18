import React from "react";
import {
	Html,
	Head,
	Body,
	Container,
	Preview,
	Section,
	Text,
	Img,
} from "@react-email/components";

const previewLang = {
	"fr": "Voici votre code de validation",
	"en": "Here is your validation code",
	"ar": "إليك رمز التحقق الخاص بك",
};

const titleLang = {
	"fr": "Voici votre code de validation",
	"en": "Here is your validation code",
	"ar": "إليك رمز التحقق الخاص بك",
};

const welcomeLang = {
	"fr": "Bienvenue sur Quiz Sprint, merci d'avoir rejoint le meilleur site de quiz du Web.",
	"en": "Welcome to Quiz Sprint, thanks for joining the best Quiz website on the World Wide Web.",
	"ar": "مرحباً بك في Quiz Sprint، شكراً لانضمامك إلى أفضل موقع مسابقات على الويب.",
};

const codeTextLang = {
	"fr": "Voici votre code",
	"en": "Here is your code",
	"ar": "إليك الرمز الخاص بك",
};

const ignoreLang = {
	"fr": "Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer ce courriel.",
	"en": "If you did not initiate this request, ignore this email.",
	"ar": "إذا لم تكن أنت من بدأ هذا الطلب، في تجاهل هذه الرسالة الإلكترونية.",
};

function SignupValidationEmail({ username, code, lang })
{
	const isRTL = lang === "ar";

	const bodyStyle = {
		backgroundColor: "#ffffff",
		color: "#24292e",
		fontFamily:
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
		margin: 0,
		padding: 0,
		direction: isRTL ? "rtl" : "ltr",
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
		textAlign: isRTL ? "right" : "left",
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

	return React.createElement(
		Html,
		{ dir: isRTL ? "rtl" : "ltr", lang },

		React.createElement(Head, null),

		React.createElement(
			Preview,
			null,
			previewLang[lang]
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
					React.createElement("strong", null, username),
					", ",
					titleLang[lang]
				),

				React.createElement(
					Text,
					{ style: paragraphStyle },
					welcomeLang[lang]
				),

				React.createElement(
					Section,
					{ style: boxStyle },

					React.createElement(
						Text,
						{ style: paragraphStyle2 },
						codeTextLang[lang]
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
					ignoreLang[lang]
				)
			)
		)
	);
}

export default SignupValidationEmail;