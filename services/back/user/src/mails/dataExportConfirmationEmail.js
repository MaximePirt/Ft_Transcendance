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

const boxStyle = {
  padding: "24px",
  border: "1px solid #dedede",
  borderRadius: "5px",
  textAlign: "center",
};

const paragraphStyle = {
  margin: "0 0 10px 0",
  textAlign: "left",
  fontSize: "14px",
};

const warningStyle = {
  padding: "20px",
  margin: "0 0 10px 0",
  fontSize: "10px",
  textAlign: "center",
};

function DataExportConfirmationEmail({ username }) {
  return React.createElement(
    Html,
    null,

    React.createElement(Head, null),

    React.createElement(
      Preview,
      null,
      `Hey ${username}, Your data export request was successful`
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
          ", your data export request was successful"
        ),

        React.createElement(
          Section,
          { style: boxStyle },

          React.createElement(
            Text,
            { style: paragraphStyle },
            React.createElement("strong", null, "In case you ever lose it:")
          ),

          React.createElement(
            Text,
            { style: paragraphStyle },
            "We gave you a copy of your file so you don't need to travel with it 🙂"
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

module.exports = DataExportConfirmationEmail;