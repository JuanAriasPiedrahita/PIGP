import nodemailer, { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendMail(to: string, subject: string, text: string): Promise<void> {
  const from = `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM}>`;
  await getTransporter().sendMail({ from, to, subject, text });
}

export function getEmailDelayMs(): number {
  return Number(process.env.EMAIL_DELAY_MS || 500);
}

export { delay as waitEmailDelay };
