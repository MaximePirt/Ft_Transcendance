const React = require("react");
const {
  Html,
  Head,
  Body,
  Container,
  Preview,
  Section,
  Text,
  Img,
} = require("@react-email/components");

const previewLang = {
	"fr": "Votre demande d'exportation de données a été acceptée",
	"en": "Your data export request was successful",
	"ar": "تم تنفيذ طلب تصدير البيانات بنجاح",
};

const titleLang = {
  "fr": ", votre demande d'exportation de données a été acceptée",
  "en": ", your data export request was successful",
  "ar": " تم تنفيذ طلب تصدير البيانات بنجاح",
};

const ignoreLang = {
	"fr": "Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer ce courriel.",
	"en": "If you did not initiate this request, ignore this email.",
	"ar": "إذا لم تكن أنت من بدأ هذا الطلب، في تجاهل هذه الرسالة الإلكترونية.",
};

const textLang = {
	"fr": "Au cas où vous le perdriez :",
	"en": "In case you ever lose it:",
	"ar": "في حال فقدته يوماً ما:",
};

const text2Lang = {
	"fr": "Nous vous donnons une copie de votre fichier afin que vous n'ayez pas besoin de l'emporter avec vous 🙂",
	"en": "We gave you a copy of your file so you don't need to travel with it 🙂",
	"ar": "لقد أعطيناك نسخة من ملفك حتى لا تحتاج إلى السفر به 🙂",
};

function DataExportConfirmationEmail({ username, lang }) {
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

  const boxStyle = {
    padding: "24px",
    border: "1px solid #dedede",
    borderRadius: "5px",
    textAlign: "center",
  };

  const paragraphStyle = {
    margin: "0 0 10px 0",
    textAlign: isRTL ? "right" : "left",
    fontSize: "14px",
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
          titleLang[lang]
        ),

        React.createElement(
          Section,
          { style: boxStyle },

          React.createElement(
            Text,
            { style: paragraphStyle },
            React.createElement("strong", null, textLang[lang])
          ),

          React.createElement(
            Text,
            { style: paragraphStyle },
            text2Lang[lang]
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

module.exports = DataExportConfirmationEmail;