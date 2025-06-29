import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendInvoiceEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to,
    subject,
    html,
  });
  return info;
}

export async function sendLowCreditsEmail({
  to,
  name,
  credits,
  discounts = [],
}: {
  to: string;
  name?: string;
  credits: number;
  discounts?: string[];
}) {
  const subject = `Your credits are running low – Top up now and save!`;
  const discountText = discounts.length
    ? `<ul style="margin: 8px 0 0 16px; color: #2563eb;">${discounts.map(d => `<li>${d}</li>`).join('')}</ul>`
    : '<span style="color: #2563eb;">Check for available discounts in your dashboard!</span>';
  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background: #f9fafb;">
      <h2 style="color: #dc2626; text-align:center; margin-bottom: 0;">⚠️ Low Credits Alert</h2>
      <p style="text-align:center; color: #555; margin-top: 4px;">Hi${name ? ' ' + name : ''}, your account credits have dropped below <b>30</b>.</p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #e0e0e0;" />
      <p style="font-size: 16px; color: #222;">You currently have <b>${credits}</b> credits left.</p>
      <p style="color: #555;">To keep using all features without interruption, please top up your credits.</p>
      <a href="https://dionysus-gray.vercel.app/billing" style="display:inline-block; margin: 18px 0 10px 0; padding: 12px 28px; background: #2563eb; color: #fff; border-radius: 6px; text-decoration: none; font-weight: bold;">Buy Credits Now</a>
      <div style="margin-top: 24px; background: #e0f2fe; padding: 16px 20px; border-radius: 8px; color: #0369a1;">
        <b>Discounts & Offers:</b>
        ${discountText}
      </div>
      <p style="margin-top: 32px; color: #555;">If you have any questions, simply reply to this email. We're here to help!</p>
      <p style="font-size: 12px; color: #888; margin-top: 30px; text-align:center;">&copy; ${new Date().getFullYear()} Dionysus</p>
    </div>
  `;
  return transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to,
    subject,
    html,
  });
}
