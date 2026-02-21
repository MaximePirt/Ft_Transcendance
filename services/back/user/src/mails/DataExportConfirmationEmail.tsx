import {
  Html,
  Head,
  Body,
  Container,
  Preview,
  Section,
  Text,
  Img,
  Button,
} from "@react-email/components";
import * as React from "react";

type Props = {
  username: string;
  downloadUrl: string;
};

const bodyStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  color: "#24292e",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
};

const containerStyle: React.CSSProperties = {
  maxWidth: "480px",
  margin: "0 auto",
  padding: "20px 0 48px",
};

const titleStyle: React.CSSProperties = {
  fontSize: "24px",
  lineHeight: "1.25",
  marginBottom: "16px",
};

const cardStyle: React.CSSProperties = {
  padding: "24px",
  border: "1px solid #dedede",
  borderRadius: "5px",
  textAlign: "center",
};

const paragraphStyle: React.CSSProperties = {
  margin: "0 0 10px 0",
  textAlign: "left",
  fontSize: "14px",
};

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  marginTop: "16px",
  backgroundColor: "#28a745",
  color: "#ffffff",
  fontSize: "14px",
  padding: "12px 24px",
  borderRadius: "6px",
  textDecoration: "none",
};

function DataExportConfirmation({ username, downloadUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Hey Username, Your data export request was successful</Preview>

      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Img
            src="https://d1nhio0ox7pgb.cloudfront.net/_img/o_collection_png/green_dark_grey/256x256/plain/check.png"
            width="32"
            height="32"
            alt="Logo"
            style={{ marginBottom: "16px" }}
          />

          <Text style={titleStyle}>
            <strong>Username</strong>, your data export request was successful
          </Text>

          <Section style={cardStyle}>
            <Text style={paragraphStyle}>
              <strong>In case you ever lose it:</strong>
            </Text>

            <Text style={paragraphStyle}>
              We gave you a copy of your file so you don't need to travel with it 🙂
            </Text>

            <Button href={downloadUrl} style={buttonStyle}>
              Recover your data
            </Button>
          </Section>
        </Container>
        <Text>
          If you did not initiate this request, ignore this email.
        </Text>
      </Body>
    </Html>
  );
}

export default DataExportConfirmation;