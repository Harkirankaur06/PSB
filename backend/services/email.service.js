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

async function sendDuressAlertEmail({ email, deviceName, reason }) {
  return sendEmail({
    to: email,
    subject: "Silent protection mode activated",
    text: `A protected account access event was triggered from ${deviceName || "a device"}.${
      reason ? ` Reason: ${reason}.` : ""
    } Review the session immediately.`,
    html: `<p>A protected account access event was triggered from <strong>${
      deviceName || "a device"
    }</strong>.</p><p>${reason ? `Reason: <strong>${reason}</strong>. ` : ""}Review the session immediately.</p>`,
  });
}

async function sendImportantActionEmail({ email, action, summary, details = [] }) {
  const safeDetails = details.filter(Boolean);
  const detailText = safeDetails.length ? `\nDetails:\n- ${safeDetails.join("\n- ")}` : "";
  const detailHtml = safeDetails.length
    ? `<ul>${safeDetails.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : "";

  return sendEmail({
    to: email,
    subject: `Important account activity: ${action}`,
    text: `${summary}${detailText}`,
    html: `<p>${summary}</p>${detailHtml}`,
  });
}

module.exports = {
  sendOtpEmail,
  sendNewDeviceNotification,
  sendDuressAlertEmail,
  sendImportantActionEmail,
};
