import { SendEmailCommand, SESv2Client } from "npm:@aws-sdk/client-sesv2";
import { type EmailConfig, type SendVerificationRequestParams } from "npm:@auth/core/providers";

type Theme = { brandColor?: string; buttonText?: string };

function emailProviderFactory(config: EmailConfig): EmailConfig {
  return {
    id: "email",
    type: "email",
    name: "Email",
    from: "Auth.js <no-reply@authjs.dev>",
    maxAge: 24 * 60 * 60,
    // @ts-expect-error - Copied from npm:@auth/core/providers/email.js because it would require nodemailer, but we want to use npm:@aws-sdk/client-sesv2
    options: config,
  };
}

export const emailProvider = emailProviderFactory({
  server: Deno.env.get("EMAIL_SERVER"),
  from: Deno.env.get("EMAIL_FROM"),
  id: "email",
  type: "email",
  name: "Email",
  maxAge: 24 * 60 * 60,
  sendVerificationRequest,
});

async function sendVerificationRequest(
  params: SendVerificationRequestParams,
) {
  const { identifier, url, provider, theme } = params;
  const { host } = new URL(url);
  const emailClient = new SESv2Client({ region: "eu-central-1" });
  const emailCommand = new SendEmailCommand({
    FromEmailAddress: provider.from,
    Destination: {
      ToAddresses: [identifier],
    },
    Content: { // Email Content
      Simple: {
        Subject: {
          Charset: "UTF-8",
          Data: `Verify your Email for ${host}`,
        },
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: text({ url, host }),
          },
          Html: {
            Charset: "UTF-8",
            Data: html({
              url,
              host,
              theme, // example { brandColor: "#00ffaa", buttonText: "Verify Email Yoooo" },
            }),
          },
        },
      },
    },
  });
  try {
    const response = await emailClient.send(emailCommand);
    console.log("email AWS SES response", response);
  } catch (e) {
    console.log("email AWS SES error", e);
  }
}

/**
 * Email HTML body
 * Insert invisible space into domains from being turned into a hyperlink by email
 * clients like Outlook and Apple mail, as this is confusing because it seems
 * like they are supposed to click on it to sign in.
 *
 * @note We don't add the email address to avoid needing to escape it, if you do, remember to sanitize it!
 */
function html(
  params: {
    url: string;
    host: string;
    theme: Theme;
  },
) {
  const { url, host, theme } = params;

  const escapedHost = host.replace(/\./g, "&#8203;.");

  const brandColor = theme.brandColor || "#346df1";
  const color = {
    background: "#f9f9f9",
    text: "#444",
    mainBackground: "#fff",
    buttonBackground: brandColor,
    buttonBorder: brandColor,
    buttonText: theme.buttonText || "#fff",
  };

  return `
<body style="background: ${color.background};">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        Stock Trend Strategy<br>
        Sign in to <strong>${escapedHost}</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="${color.buttonBackground}"><a href="${url}"
                target="_blank"
                style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${color.buttonText}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${color.buttonBorder}; display: inline-block; font-weight: bold;">Sign
                in</a></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        If you did not request this email you can safely ignore it.
      </td>
    </tr>
  </table>
</body>
`;
}

/** Email Text body (fallback for email clients that don't render HTML, e.g. feature phones) */
function text({ url, host }: { url: string; host: string }) {
  return `Stock Trend Strategy - Sign in to ${host}\n${url}\n\n`;
}
