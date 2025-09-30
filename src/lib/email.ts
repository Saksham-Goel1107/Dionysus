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
    ? `<ul style="margin: 8px 0 0 16px; color: #2563eb;">${discounts.map((d) => `<li>${d}</li>`).join('')}</ul>`
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

export async function sendDataExportWarningEmail({ to, name }: { to: string; name?: string }) {
  const subject = '⚠️ Your Dionysus Data Was Exported';

  const html = `
  <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb; color: #1f2937;">
    <h2 style="color: #dc2626; text-align: center; margin-top: 0; margin-bottom: 8px;">⚠️ Data Export Alert</h2>
    <p style="text-align: center; font-size: 16px; margin-top: 0; margin-bottom: 24px;">
      Hi${name ? ' ' + name : ''}, your account data was recently exported from Dionysus.
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

    <p style="font-size: 16px; margin-bottom: 16px;">
      If you initiated this export, no further action is needed.
    </p>
    <p style="font-size: 16px; margin-bottom: 24px;">
      If you <strong>did not</strong> perform this action, please <a href="https://dionysus-gray.vercel.app/support" style="color: #2563eb; text-decoration: none;">contact support immediately</a>.
    </p>

    <p style="font-size: 15px; color: #6b7280; margin-bottom: 32px;">
      This is a security notification sent to help protect your account.
    </p>

    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 40px;">
      &copy; ${new Date().getFullYear()} Dionysus. All rights reserved.
    </p>
  </div>
`;

  return transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to,
    subject,
    html,
  });
}

export async function sendPasswordChangeWarningEmail({ to, name }: { to: string; name?: string }) {
  const subject = '⚠️ Your Dionysus Password Was Changed';
  const html = `
  <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb; color: #1f2937;">
    <h2 style="color: #dc2626; text-align: center; margin-top: 0; margin-bottom: 8px;">⚠️ Password Change Alert</h2>
    <p style="text-align: center; font-size: 16px; margin-top: 0; margin-bottom: 24px;">
      Hi${name ? ' ' + name : ''}, your account password was recently changed on Dionysus.
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="font-size: 16px; margin-bottom: 16px;">
      If you initiated this password change, no further action is needed.
    </p>
    <p style="font-size: 16px; margin-bottom: 24px;">
      If you <strong>did not</strong> perform this action, please <a href="https://dionysus-gray.vercel.app/support" style="color: #2563eb; text-decoration: none;">contact support immediately</a>.
    </p>
    <p style="font-size: 15px; color: #6b7280; margin-bottom: 32px;">
      This is a security notification sent to help protect your account.
    </p>
    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 40px;">
      &copy; ${new Date().getFullYear()} Dionysus. All rights reserved.
    </p>
  </div>
  `;
  return transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to,
    subject,
    html,
  });
}

export async function sendPasswordSetWarningEmail({ to, name }: { to: string; name?: string }) {
  const subject = '⚠️ A Password Was Added to Your Dionysus Account';
  const html = `
  <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb; color: #1f2937;">
    <h2 style="color: #dc2626; text-align: center; margin-top: 0; margin-bottom: 8px;">⚠️ Password Added Alert</h2>
    <p style="text-align: center; font-size: 16px; margin-top: 0; margin-bottom: 24px;">
      Hi${name ? ' ' + name : ''}, a password was just added to your Dionysus account.
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="font-size: 16px; margin-bottom: 16px;">
      If you added this password, no further action is needed.
    </p>
    <p style="font-size: 16px; margin-bottom: 24px;">
      If you <strong>did not</strong> perform this action, please <a href="https://dionysus-gray.vercel.app/support" style="color: #2563eb; text-decoration: none;">contact support immediately</a>.
    </p>
    <p style="font-size: 15px; color: #6b7280; margin-bottom: 32px;">
      This is a security notification sent to help protect your account.
    </p>
    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 40px;">
      &copy; ${new Date().getFullYear()} Dionysus. All rights reserved.
    </p>
  </div>
  `;
  return transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to,
    subject,
    html,
  });
}

export async function sendPasswordDeleteWarningEmail({ to, name }: { to: string; name?: string }) {
  const subject = '⚠️ Password Lock Disabled on Your Dionysus Account';
  const html = `
  <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb; color: #1f2937;">
    <h2 style="color: #dc2626; text-align: center; margin-top: 0; margin-bottom: 8px;">⚠️ Password Lock Disabled</h2>
    <p style="text-align: center; font-size: 16px; margin-top: 0; margin-bottom: 24px;">
      Hi${name ? ' ' + name : ''}, password protection was just <b>disabled</b> on your Dionysus account.
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="font-size: 16px; margin-bottom: 16px;">
      If you disabled password lock, no further action is needed.
    </p>
    <p style="font-size: 16px; margin-bottom: 24px;">
      If you <strong>did not</strong> perform this action, please <a href="https://dionysus-gray.vercel.app/support" style="color: #2563eb; text-decoration: none;">contact support immediately</a>.
    </p>
    <p style="font-size: 15px; color: #6b7280; margin-bottom: 32px;">
      This is a security notification sent to help protect your account.
    </p>
    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 40px;">
      &copy; ${new Date().getFullYear()} Dionysus. All rights reserved.
    </p>
  </div>
  `;
  return transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to,
    subject,
    html,
  });
}

import { generateCouponCode } from '@/app/(protected)/billing/couponUtils';
import { encode as htmlEncode } from 'he';

export async function sendNewAccountWelcomeEmail({ to, name }: { to: string; name?: string }) {
  const subject = '🎉 Welcome to Dionysus!';
  let coupon = '';
  try {
    const couponResult = await generateCouponCode(
      25,
      10080,
      1,
      process.env.BYPASS_COUPON_SECRET as string | undefined,
    );
    coupon = typeof couponResult === 'string' ? couponResult : '';
  } catch {
    coupon = '';
  }

  const couponSection = coupon
    ? `
    <div style="
      background-color: #fff7e6;
      border: 1.5px dashed #f5c518;
      border-radius: 12px;
      padding: 20px;
      margin: 32px 0;
      box-shadow: 0 3px 10px rgba(245, 197, 24, 0.25);
      color: #b47e00;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 480px;
      margin-left: auto;
      margin-right: auto;
      text-align: center;
    ">
      <h2 style="margin: 0 0 10px 0; font-weight: 700; font-size: 1.3rem; color: #a67c00;">
        🎁 Welcome Gift: <span style="color: #d28e00;">25% OFF</span>
      </h2>
      <p style="margin: 0 0 12px 0; font-size: 1rem;">
        Use this one-time coupon code within 7 days:
      </p>
      <div style="
        font-weight: 700;
        font-size: 1.4rem;
        letter-spacing: 2px;
        background-color: #fff3b0;
        color: #a67c00;
        padding: 12px 24px;
        border-radius: 8px;
        border: 1.5px solid #f5c518;
        display: inline-block;
        user-select: all;
        margin-bottom: 16px;
      ">
        ${htmlEncode(coupon)}
      </div>
      <ol style="
        text-align: left;
        padding-left: 20px;
        font-size: 0.95rem;
        line-height: 1.6;
        color: #8c6d00;
        max-width: 420px;
        margin-left: auto;
        margin-right: auto;
      ">
        <li>Click the <strong>Claim Coupon</strong> button below to open your billing page.</li>
        <li>Paste the coupon code above into the <strong>Coupon</strong> field.</li>
        <li>Click <strong>Apply</strong> to receive 25% off your next purchase. (One-time use, valid for 7 days)</li>
      </ol>
      <a href="https://dionysus-gray.vercel.app/billing" style="
        display: inline-block;
        margin-top: 20px;
        padding: 14px 38px;
        background: linear-gradient(90deg, #2563eb 0%, #6366f1 100%);
        color: white !important;
        border-radius: 8px;
        font-weight: 700;
        font-size: 1rem;
        text-decoration: none;
        box-shadow: 0 3px 8px rgba(99, 102, 241, 0.6);
        transition: background 0.3s ease;
      " onmouseover="this.style.background='linear-gradient(90deg, #1d4ed8 0%, #4338ca 100%)'" onmouseout="this.style.background='linear-gradient(90deg, #2563eb 0%, #6366f1 100%)'">
        Claim Coupon
      </a>
      <p style="margin-top: 14px; font-size: 0.85rem; color: #b91c1c; font-weight: 600;">
        ⚠️ <strong>Do not share this code.</strong> This coupon is one-time use and <u>anyone</u> with the code can claim it.
      </p>
    </div>
  `
    : '';

  const html = `
  <div style="
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 40px 32px;
    background-color: #ffffff;
    border-radius: 14px;
    box-shadow: 0 4px 12px rgba(31, 41, 55, 0.12);
    color: #1f2937;
  ">
    <div style="text-align: center; margin-bottom: 28px;">
      <h1 style="font-size: 2.2rem; font-weight: 700; margin: 0; color: #2563eb;">Welcome to Dionysus!</h1>
    </div>

    <p style="font-size: 1.15rem; margin-bottom: 28px; text-align: center; color: #374151;">
      Hi${name ? ' ' + name : ''}, we're thrilled to have you join our community.
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;" />

    <p style="font-size: 1rem; margin-bottom: 28px; text-align: center; color: #4b5563;">
      Your account has been created successfully. You now have access to all the features Dionysus offers.
    </p>

    ${couponSection}

    <a href="https://dionysus-gray.vercel.app/dashboard" style="
      display: block;
      width: fit-content;
      margin: 0 auto 36px auto;
      padding: 16px 36px;
      background: linear-gradient(90deg, #2563eb 0%, #6366f1 100%);
      color: white !important;
      border-radius: 10px;
      font-weight: 700;
      font-size: 1.1rem;
      text-decoration: none;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
      transition: background 0.3s ease;
    " onmouseover="this.style.background='linear-gradient(90deg, #1d4ed8 0%, #4338ca 100%)'" onmouseout="this.style.background='linear-gradient(90deg, #2563eb 0%, #6366f1 100%)'">
      Go to Dashboard
    </a>

    <p style="font-size: 0.9rem; color: #6b7280; margin-bottom: 32px; text-align: center;">
      If you <strong>did not</strong> create this account, please <a href="https://dionysus-gray.vercel.app/support" style="color: #dc2626; text-decoration: underline;">contact support immediately</a>.
    </p>

    <div style="
      background-color: #e0f2fe;
      padding: 18px 24px;
      border-radius: 12px;
      color: #0369a1;
      text-align: center;
      font-weight: 600;
      font-size: 1rem;
      margin-bottom: 32px;
      user-select: none;
    ">
      Need help? Visit our <a href="https://dionysus-gray.vercel.app/support" style="color: #2563eb; text-decoration: underline;">Support Center</a> or reply to this email.
    </div>

    <p style="font-size: 0.75rem; color: #9ca3af; text-align: center; margin-top: 40px; user-select: none;">
      &copy; ${new Date().getFullYear()} Dionysus. All rights reserved.
    </p>
  </div>
  `;

  return transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to,
    subject,
    html,
  });
}

export async function sendUserBlockedEmail({ to, name }: { to: string; name?: string }) {
  const subject = '🚫 Your Dionysus Account Has Been Blocked';
  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb; color: #1f2937;">
      <h2 style="color: #dc2626; text-align: center; margin-top: 0; margin-bottom: 8px;">🚫 Account Blocked</h2>
      <p style="text-align: center; font-size: 16px; margin-top: 0; margin-bottom: 24px;">
        Hi${name ? ' ' + name : ''}, your Dionysus account has been <b>blocked</b> due to unusual activity or a violation of our terms of service.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 16px; margin-bottom: 16px;">
        If you believe this is a mistake or need more information, please <a href="mailto:sakshamgoel1107@gmail.com" style="color: #2563eb; text-decoration: none;">contact our support team</a>.
      </p>
      <p style="font-size: 16px; margin-bottom: 24px;">
        While your account is blocked, you will not be able to access Dionysus services.
      </p>
      <p style="font-size: 15px; color: #6b7280; margin-bottom: 32px;">
        This action was taken to protect your account and our platform.
      </p>
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 40px;">
        &copy; ${new Date().getFullYear()} Dionysus. All rights reserved.
      </p>
    </div>
  `;
  return transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to,
    subject,
    html,
  });
}

export async function sendUserUnblockedEmail({ to, name }: { to: string; name?: string }) {
  const subject = '✅ Your Dionysus Account Has Been Unblocked';
  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #f9fafb; color: #1f2937;">
      <h2 style="color: #16a34a; text-align: center; margin-top: 0; margin-bottom: 8px;">✅ Account Unblocked</h2>
      <p style="text-align: center; font-size: 16px; margin-top: 0; margin-bottom: 24px;">
        Hi${name ? ' ' + name : ''}, your Dionysus account has been <b>unblocked</b> and access has been restored.
      </p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
      <p style="font-size: 16px; margin-bottom: 16px;">
        You can now log in and continue using Dionysus. If you have any questions, please <a href="mailto:sakshamgoel1107@gmail.com" style="color: #2563eb; text-decoration: none;">contact our support team</a>.
      </p>
      <p style="font-size: 15px; color: #6b7280; margin-bottom: 32px;">
        Thank you for your patience and understanding.
      </p>
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 40px;">
        &copy; ${new Date().getFullYear()} Dionysus. All rights reserved.
      </p>
    </div>
  `;
  return transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to,
    subject,
    html,
  });
}

export async function sendN8nRegistrationEmail({ to, name }: { to: string; name?: string }) {
  const subject = 'Your n8n Instance — Access & Setup Details';

  const html = `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width:680px;margin:0 auto;background:#ffffff;border-radius:10px;padding:28px;border:1px solid #eef2ff;color:#0f172a;">
    <h1 style="color:#2563eb;margin:0 0 8px 0;">n8n Access Details</h1>
    <p style="color:#374151;margin:0 0 16px 0;">Hi${name ? ' ' + name : ''}, your account was registered with our self-hosted n8n instance. Below are the details and a short guide to get started.</p>

    <div style="background:#f8fafc;padding:16px;border-radius:8px;margin-bottom:16px;border:1px solid #e6eef8;">
      <p style="margin:0 0 8px 0;font-size:16px;"><strong>Access n8n:</strong> <a href="https://n8n-ceaw.onrender.com" style="color:#2563eb;text-decoration:underline;">https://n8n-ceaw.onrender.com</a></p>
      <p style="margin:4px 0 0 0;font-size:14px;color:#6b7280;">We recommend copying the password and storing it in a password manager.</p>
    </div>

    <h3 style="margin-top:8px;color:#111;font-size:1rem;">Quick Start Guide</h3>
    <ol style="color:#374151;margin:8px 0 16px 20px;">
      <li>Open the n8n URL and sign in with the credentials above.</li>
      <li>Create a new workflow: <em>Workflows → New → Choose Trigger</em>.</li>
      <li>Add a node and connect it to test runs. See the <a href="https://docs.n8n.io/" style="color:#2563eb;">n8n docs</a> for examples.</li>
    </ol>

    <div style="background:#fffbeb;border:1px dashed #f59e0b;padding:12px;border-radius:8px;margin-bottom:16px;color:#92400e;">
      <strong>Security recommendations:</strong>
      <ul style="margin:8px 0 0 18px;color:#92400e;">
        <li>Enable two-factor authentication (2FA) for your Dionysus account if available.</li>
        <li>Do not reuse passwords across services — use a password manager.</li>
        <li>If you suspect any compromise, rotate the n8n password immediately.</li>
      </ul>
    </div>

    <p style="color:#374151;font-size:14px;margin-bottom:10px;">We also checked the password against public breach databases at the time of registration; however, it's a good idea to run your own checks at <a href="https://haveibeenpwned.com/" style="color:#2563eb;">Have I Been Pwned</a> and avoid passwords that appear there.</p>

    <p style="font-size:12px;color:#94a3b8;margin-top:22px;text-align:center;">&copy; ${new Date().getFullYear()} Dionysus</p>
  </div>
  `;

  return transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@example.com',
    to,
    subject,
    html,
  });
}

export async function sendWarningEmail({
  to,
  userName,
  subject,
  message,
  reason,
}: {
  to: string;
  userName: string;
  subject: string;
  message: string;
  reason?: string;
}) {
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff; color: #202124; line-height: 1.6;">

  <!-- Header -->
  <h2 style="color: #d93025; text-align: center; margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">
    Warning from Dionysus Admin
  </h2>
  <p style="text-align: center; color: #5f6368; margin: 0 0 24px 0; font-size: 15px;">
    Hi ${userName},
  </p>

  <!-- Subject & Message -->
  <div style="border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin-bottom: 20px; background: #fafafa;">
    <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 500; color: #202124;">
      Subject: ${subject}
    </h3>
    <p style="margin: 0; font-size: 14px; color: #3c4043; white-space: pre-wrap;">
      ${message}
    </p>
  </div>

  <!-- Reason for Warning (optional) -->
  ${
    reason
      ? `
  <div style="border: 1px solid #f1d2d2; padding: 14px; border-radius: 6px; margin-bottom: 20px; background: #fef2f2;">
    <strong style="color: #b3261e; display: block; margin-bottom: 6px; font-size: 14px;">Reason for Warning:</strong>
    <p style="color: #3c4043; margin: 0; font-size: 14px;">${reason}</p>
  </div>
  `
      : ''
  }

  <!-- Guidelines Reminder -->
  <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 20px;">
    <h4 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 500; color: #202124;">
      Community Guidelines Reminder
    </h4>
    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #3c4043;">
      <li>Respect all community members</li>
      <li>Keep discussions constructive and on-topic</li>
      <li>Avoid spam, harassment, or inappropriate content</li>
      <li>Follow our terms of service</li>
    </ul>
  </div>

  <!-- Footer -->
  <p style="font-size: 13px; color: #5f6368; margin: 24px 0 12px 0;">
    If you believe this warning was sent in error or have questions, please contact our support team.
  </p>

  <p style="font-size: 12px; color: #9aa0a6; margin: 20px 0 0 0; text-align: center;">
    &copy; ${new Date().getFullYear()} Dionysus. All rights reserved.
  </p>
</div>

  `;

  return transporter.sendMail({
    from: process.env.SMTP_FROM || 'admin@dionysus.com',
    to,
    subject: `Warning: ${subject}`,
    html,
  });
}

export async function sendBanEmail({
  to,
  userName,
  reason,
  banDuration,
}: {
  to: string;
  userName: string;
  reason: string;
  banDuration?: string;
}) {
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff; color: #202124; line-height: 1.6;">

  <!-- Header -->
  <h2 style="color: #d93025; text-align: center; margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">
    Account Suspension Notice
  </h2>
  <p style="text-align: center; color: #5f6368; margin: 0 0 24px 0; font-size: 15px;">
    Hi ${userName},
  </p>

  <!-- Ban Notice -->
  <div style="border: 1px solid #f1d2d2; padding: 20px; border-radius: 8px; margin-bottom: 20px; background: #fef2f2;">
    <p style="margin: 0 0 12px 0; font-size: 15px; color: #3c4043;">
      We regret to inform you that your account has been suspended from Dionysus.
    </p>
    <p style="margin: 0 0 12px 0; font-size: 15px; color: #3c4043;">
      <strong>Reason for suspension:</strong> ${reason}
    </p>
    ${
      banDuration
        ? `<p style="margin: 0; font-size: 15px; color: #3c4043;">
            <strong>Duration:</strong> ${banDuration}
          </p>`
        : `<p style="margin: 0; font-size: 15px; color: #3c4043;">
            <strong>Duration:</strong> Permanent
          </p>`
    }
  </div>

  <!-- What This Means -->
  <div style="border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin-bottom: 20px; background: #fafafa;">
    <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 500; color: #202124;">
      What This Means
    </h3>
    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #3c4043;">
      <li>You will not be able to access your account or post content</li>
      <li>Your existing comments and posts remain visible to others</li>
      <li>You can appeal this decision by contacting support</li>
    </ul>
  </div>

  <!-- Appeal Process -->
  <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 20px;">
    <h4 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 500; color: #202124;">
      Appeal Process
    </h4>
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #3c4043;">
      If you believe this suspension was issued in error, you may appeal by contacting our support team with your account details and an explanation of the situation.
    </p>
  </div>

  <!-- Footer -->
  <p style="font-size: 13px; color: #5f6368; margin: 24px 0 12px 0;">
    We take community safety seriously and appreciate your understanding.
  </p>

  <p style="font-size: 12px; color: #9aa0a6; margin: 20px 0 0 0; text-align: center;">
    &copy; ${new Date().getFullYear()} Dionysus. All rights reserved.
  </p>
</div>

  `;

  return transporter.sendMail({
    from: process.env.SMTP_FROM || 'admin@dionysus.com',
    to,
    subject: 'Account Suspension Notice',
    html,
  });
}

export async function sendUnbanEmail({ to, userName }: { to: string; userName: string }) {
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff; color: #202124; line-height: 1.6;">

  <!-- Header -->
  <h2 style="color: #188038; text-align: center; margin: 0 0 12px 0; font-size: 20px; font-weight: 600;">
    Account Reinstated
  </h2>
  <p style="text-align: center; color: #5f6368; margin: 0 0 24px 0; font-size: 15px;">
    Hi ${userName},
  </p>

  <!-- Good News -->
  <div style="border: 1px solid #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; background: #d1ecf1;">
    <p style="margin: 0 0 12px 0; font-size: 15px; color: #3c4043;">
      Great news! Your account has been reinstated and you now have full access to Dionysus.
    </p>
    <p style="margin: 0; font-size: 15px; color: #3c4043;">
      We appreciate your patience during the review process.
    </p>
  </div>

  <!-- What This Means -->
  <div style="border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; margin-bottom: 20px; background: #fafafa;">
    <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 500; color: #202124;">
      What This Means
    </h3>
    <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #3c4043;">
      <li>You can now log in and access all features</li>
      <li>You can post comments and interact with content</li>
      <li>All platform features are available to you</li>
    </ul>
  </div>

  <!-- Community Guidelines Reminder -->
  <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 20px;">
    <h4 style="margin: 0 0 8px 0; font-size: 15px; font-weight: 500; color: #202124;">
      Community Guidelines
    </h4>
    <p style="margin: 0 0 12px 0; font-size: 14px; color: #3c4043;">
      Please continue to follow our community guidelines to maintain a positive environment for all users.
    </p>
  </div>

  <!-- Footer -->
  <p style="font-size: 13px; color: #5f6368; margin: 24px 0 12px 0;">
    Welcome back! We're glad to have you as part of our community.
  </p>

  <p style="font-size: 12px; color: #9aa0a6; margin: 20px 0 0 0; text-align: center;">
    &copy; ${new Date().getFullYear()} Dionysus. All rights reserved.
  </p>
</div>

  `;

  return transporter.sendMail({
    from: process.env.SMTP_FROM || 'admin@dionysus.com',
    to,
    subject: 'Account Reinstated - Welcome Back!',
    html,
  });
}
