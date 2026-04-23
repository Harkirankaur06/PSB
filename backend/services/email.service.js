let nodemailer = null;

try {
  nodemailer = require("nodemailer");
} catch {
  nodemailer = null;
}

function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.EMAIL_FROM &&
      nodemailer
  );
}

async function sendEmail({ to, subject, text, html }) {
  if (!isEmailConfigured()) {
    console.log("[email:fallback]", { to, subject, text });
    return { delivered: false, mode: "fallback" };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });

  return { delivered: true, mode: "smtp" };
}

async function sendOtpEmail({ email, otp, deviceName }) {
  return sendEmail({
    to: email,
    subject: "Your L.E.G.E.N.D. verification code",
    text: `Your OTP for ${deviceName || "a new device"} is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your OTP for <strong>${deviceName || "a new device"}</strong> is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });
}

async function sendNewDeviceNotification({ email, deviceName }) {
  return sendEmail({
    to: email,
    subject: "New device login detected",
    text: `A login from ${deviceName || "a new device"} was detected on your L.E.G.E.N.D. account.`,
    html: `<p>A login from <strong>${deviceName || "a new device"}</strong> was detected on your L.E.G.E.N.D. account.</p>`,
  });
}

module.exports = {
  sendOtpEmail,
  sendNewDeviceNotification,
};
