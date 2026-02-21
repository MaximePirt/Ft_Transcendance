const React = require("react");
const { Html, Head, Body, Container, Text } = require("@react-email/components");

function DataExportConfirmationEmail({ username }) {
  return React.createElement(
    Html,
    null,
    React.createElement(Head, null),
    React.createElement(
      Body,
      null,
      React.createElement(
        Container,
        null,
        React.createElement(Text, null, `Bonjour ${username},`),
        React.createElement(Text, null, "Votre export de données est prêt.")
      )
    )
  );
}

module.exports = DataExportConfirmationEmail;