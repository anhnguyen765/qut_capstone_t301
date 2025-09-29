import { NextResponse } from "next/server";
const nodemailer = require("nodemailer");

export async function GET() {
  return new NextResponse(
    `<html>
      <body>
        <h1>SMTP Test API</h1>
        <p>Click the button below to send a test email to <strong>biglovefromquangnam@gmail.com</strong>.</p>
        <button onclick="sendEmail()">Send Test Email</button>
        <p id="result"></p>
        <script>
          async function sendEmail() {
            const res = await fetch(window.location.href, { method: "POST" });
            const data = await res.json();
            document.getElementById("result").innerText = res.ok 
              ? "✅ Email sent! Message ID: " + data.messageId 
              : "❌ Error: " + data.error;
          }
        </script>
      </body>
    </html>`,
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}

export async function POST() {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      authMethod: "LOGIN",
      debug: true,
      logger: true,
      tls: {
        rejectUnauthorized: false,
        debug: true
      }
    });

    await transporter.verify();
    console.log("✅ SMTP login successful");

    const info = await transporter.sendMail({
      from: `"SMTP Test" <${process.env.SMTP_USER}>`,
      to: "biglovefromquangnam@gmail.com",
      subject: "SMTP Test from Next.js",
      text: "This is a test email sent via cPanel SMTP from Next.js project",
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      to: "biglovefromquangnam@gmail.com",
    });
  } catch (err: any) {
    console.error("❌ SMTP error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
