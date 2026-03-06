const React = require("react");
const {
  Html,
  Head,
  Body,
  Container,
  Preview,
  Text,
  Img,
} = require("@react-email/components");

const previewLang = {
	"fr": "Votre demande de suppression de votre compte a été accepté avec succès",
  "en": "Your data deletion request was successful",
	"ar": "تم حذف بياناتك بنجاح",
};

const textLang = {
  "fr": ", votre demande de suppression de votre compte a été accepté avec succès ☑",
  "en": ", your account deletion request was successful ☑",
  "ar": " تم حذف حسابك بنجاح ☑",
};

const ignoreLang = {
	"fr": "Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer ce courriel.",
	"en": "If you did not initiate this request, ignore this email.",
	"ar": "إذا لم تكن أنت من بدأ هذا الطلب، في تجاهل هذه الرسالة الإلكترونية.",
};

function DataDeletion({ username, lang }) {
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
          style: { marginBottom: "16px" },
        }),

        React.createElement(
          Text,
          { style: titleStyle },
          React.createElement("strong", null, username),
          textLang[lang]
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

module.exports = DataDeletion;