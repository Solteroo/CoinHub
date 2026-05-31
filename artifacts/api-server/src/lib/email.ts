import nodemailer from "nodemailer";

const SMTP_HOST = process.env["SMTP_HOST"] ?? "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env["SMTP_PORT"] ?? "587", 10);
const SMTP_USER = process.env["SMTP_USER"] ?? "";
const SMTP_PASS = process.env["SMTP_PASS"] ?? "";

function createTransport() {
  if (!SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendPasswordResetEmail(to: string, code: string): Promise<boolean> {
  const transport = createTransport();
  if (!transport) return false;

  try {
    await transport.sendMail({
      from: `"CoinHub" <${SMTP_USER}>`,
      to,
      subject: "CoinHub — Açar söz täzeleýiş kody",
      html: `
        <div style="background:#0f0f12;color:#fff;font-family:sans-serif;padding:32px;border-radius:12px;max-width:480px">
          <h2 style="color:#D4AF37;margin-bottom:8px">CoinHub</h2>
          <p style="color:#aaa;margin-bottom:24px">Açar söz täzeleýiş so­ragy alyndy.</p>
          <div style="background:#1a1a1f;border:1px solid #D4AF37;border-radius:8px;padding:24px;text-align:center">
            <p style="color:#aaa;font-size:13px;margin-bottom:8px">Siziň täzeleýiş koduňyz:</p>
            <p style="font-size:36px;font-weight:900;letter-spacing:8px;color:#D4AF37;margin:0">${code}</p>
          </div>
          <p style="color:#666;font-size:12px;margin-top:24px">Kod 15 minut içinde işleýär. Eger siz bu talap etmedik bolsaňyz, bu habary görmezden geliň.</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("[email] sendMail failed:", err);
    return false;
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(SMTP_USER && SMTP_PASS);
}
