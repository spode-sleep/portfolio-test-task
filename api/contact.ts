import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  comment: string;
}

async function generateSuccessMessage(name: string, userMessage: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return `Thank you, ${name}! Your message has been successfully sent. I will get in touch with you soon.`;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: `Write a short, warm and professional message confirming successful submission of a contact form. Address the person by name "${name}". The person wrote: "${userMessage}". Briefly respond to the essence of their message. Reply in English, no more than 2 sentences. Do not use an exclamation mark more than once. Do not start with "Of course" or similar introductory words.`,
          },
        ],
      }),
    });

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error("Empty response");
    return text;
  } catch (error) {
    console.error("OpenAI API error:", error);
    return `Thank you, ${name}! Your message has been received, I will get in touch with you soon.`;
  }
}

function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  console.log('[mail] SMTP config:', { host, port, user: user ? '✓' : '✗ MISSING', pass: pass ? '✓' : '✗ MISSING' });

  if (!user || !pass) {
    console.warn('[mail] transporter NOT created — missing credentials');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function createOwnerEmailHtml(data: ContactFormData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Courier New', monospace;
      background: #000e14; /* --bg */
      color: #f5d4a0; /* --text */
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      border: 1px solid #005264; /* --border */
      padding: 32px;
      background: #0b0c32; /* --bg-1 */
    }
    h1 {
      color: #00ecff; /* --accent-alt */
      font-size: 18px;
      margin: 0 0 24px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .field {
      margin-bottom: 16px;
    }
    .label {
      color: #82cab1; /* --text-dim */
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      display: block;
      margin-bottom: 4px;
    }
    .value {
      color: #f5d4a0; /* --gold-light */
      font-size: 15px;
    }
    .comment-block {
      background: #0d1a20; /* --bg-3 */
      border-left: 2px solid #00aaaa; /* --accent */
      padding: 12px 16px;
      margin-top: 8px;
      color: #f5d4a0; /* --gold-light */
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #003a4a; /* --border-light */
      color: #3a7a6a; /* --text-dimmer */
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>// new message from portfolio</h1>
    <div class="field">
      <span class="label">name</span>
      <span class="value">${data.name}</span>
    </div>
    <div class="field">
      <span class="label">email</span>
      <span class="value">${data.email}</span>
    </div>
    <div class="field">
      <span class="label">phone</span>
      <span class="value">${data.phone}</span>
    </div>
    <div class="field">
      <span class="label">message</span>
      <div class="comment-block">${data.comment.replace(/\n/g, "<br>")}</div>
    </div>
    <div class="footer">
      Sent: ${new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" })} MSK
    </div>
  </div>
</body>
</html>`;
}

function createUserEmailHtml(data: ContactFormData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Courier New', monospace;
      background: #000e14; /* --bg */
      color: #f5d4a0; /* --text */
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      border: 1px solid #005264; /* --border */
      padding: 32px;
      background: #0b0c32; /* --bg-1 */
    }
    h1 {
      color: #00ecff; /* --accent-alt */
      font-size: 18px;
      margin: 0 0 24px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .field {
      margin-bottom: 16px;
    }
    .label {
      color: #82cab1; /* --text-dim */
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      display: block;
      margin-bottom: 4px;
    }
    .value {
      color: #f5d4a0; /* --gold-light */
      font-size: 15px;
    }
    .comment-block {
      background: #0d1a20; /* --bg-3 */
      border-left: 2px solid #00aaaa; /* --accent */
      padding: 12px 16px;
      margin-top: 8px;
      color: #f5d4a0; /* --gold-light */
    }
    .notif{
      color: #f5d4a0; /* --gold-light */
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #003a4a; /* --border-light */
      color: #3a7a6a; /* --text-dimmer */
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>// message confirmation — gleb kosyrev</h1>

    <div class="field">
      <span class="label">name</span>
      <span class="value">${data.name}</span>
    </div>

    <div class="field">
      <span class="label">email</span>
      <span class="value">${data.email}</span>
    </div>

    <div class="field">
      <span class="label">phone</span>
      <span class="value">${data.phone}</span>
    </div>

    <div class="field">
      <span class="label">your message</span>
      <div class="comment-block">${data.comment.replace(/\n/g, "<br>")}</div>
    </div>

    <p class="notif">This is an automatic confirmation: your message has been received and forwarded to me. I will get back to you soon via <strong>${process.env.OWNER_EMAIL}</strong>.</p>

    <div class="footer">
      This email was sent automatically. Please do not reply to it.<br>
      Sent: ${new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" })} MSK
    </div>
  </div>
</body>
</html>`;
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, phone, email, comment } = req.body as ContactFormData;

  // Validation
  if (!name?.trim() || !phone?.trim() || !email?.trim() || !comment?.trim()) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  const ownerEmail = process.env.OWNER_EMAIL || process.env.SMTP_USER;
  console.log('[mail] ownerEmail:', ownerEmail ? '✓' : '✗ MISSING');

  const [successMessage] = await Promise.allSettled([
    generateSuccessMessage(name, comment),
    Promise.race([
      (async () => {
        if (process.env.SKIP_MAIL === 'true') {
          console.log('[mail] skipped (SKIP_MAIL=true)');
          return;
        }

        const transporter = createTransporter();
        if (!transporter) return;

        if (!ownerEmail) return;

        console.log('[mail] sending emails...');
        await Promise.all([
          transporter.sendMail({
            from: `"Gleb Kosyrev Portfolio" <${process.env.SMTP_USER}>`,
            to: ownerEmail,
            subject: `New message from ${name}`,
            html: createOwnerEmailHtml({ name, phone, email, comment }),
          }),
          transporter.sendMail({
            from: `"Gleb Kosyrev" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Your message has been received — Gleb Kosyrev",
            html: createUserEmailHtml({ name, phone, email, comment }),
          }),
        ]);
        console.log('[mail] emails sent OK');
      })(),
      new Promise<void>((_, reject) =>
        setTimeout(() => reject(new Error('[mail] timeout after 5s')), 5000)
      ),
    ]).catch((err) => console.error('[mail] failed:', err)),
  ]);

  const message =
    successMessage.status === "fulfilled"
      ? successMessage.value
      : `Thank you, ${name}! Your message has been successfully sent.`;

  return res.status(200).json({ success: true, message });
}
