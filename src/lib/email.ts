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
    const couponResult = await generateCouponCode(25, 10080, process.env.BYPASS_COUPON_SECRET);
    if (typeof couponResult === 'string') {
      coupon = couponResult;
    } else {
      coupon = '';
    }
  } catch (e) {
    coupon = '';
  }
  const couponSection = coupon
    ? `<div style=\"background: #fef9c3; padding: 22px 22px 18px 22px; border-radius: 12px; color: #92400e; margin: 32px 0 22px 0; border: 1.5px dashed #fde68a; text-align: center; box-shadow: 0 2px 8px #fde68a33;\">
        <div style=\"font-size: 1.15em; font-weight: 600; margin-bottom: 8px;\">🎁 <span style=\"color:#b45309;\">Welcome Gift: <span style=\"color:#ca8a04;\">25% OFF</span></span></div>
        <div style=\"margin-bottom: 10px; font-size: 15px;\">Use this one-time coupon code within 7 days:</div>
        <div style=\"display:inline-block; margin: 12px 0 18px 0; font-size: 1.3em; font-weight: bold; letter-spacing: 1.5px; background: #fef08a; color: #b45309; padding: 10px 22px; border-radius: 8px; border: 1.5px solid #fde68a;\">${htmlEncode(coupon)}</div>
        <ol style=\"text-align:left; max-width: 400px; margin: 18px auto 0 auto; padding-left: 18px; color: #a16207; font-size: 15px; line-height: 1.7;\">
          <li>Click the <b>Claim Coupon</b> button below to go to your billing page.</li>
          <li>Paste the coupon code above in the <b>Coupon</b> field.</li>
          <li>Click <b>Apply</b> to get 25% off your next purchase. (One-time use, valid for 7 days)</li>
        </ol>
        <a href=\"https://dionysus-gray.vercel.app/billing\" style=\"display:inline-block; margin: 22px auto 0 auto; padding: 13px 32px; background: linear-gradient(90deg,#2563eb 0%,#6366f1 100%); color: #fff; border-radius: 7px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 1px 4px #6366f133;\">Claim Coupon</a>
        <div style=\"margin-top: 18px; color: #b91c1c; font-size: 13.5px; font-weight: 500;\">
          ⚠️ <b>Do not share this code</b>. This is a one-time coupon and <u>anyone</u> can claim it with the code.
        </div>
      </div>`
    : '';
  const html = `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #f3f4f6; color: #1f2937; box-shadow: 0 2px 8px rgba(31,41,55,0.04);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="font-size: 2rem; color: #2563eb; margin: 0;">Welcome to Dionysus!</h1>
    </div>
    <p style="font-size: 18px; text-align: center; margin-bottom: 24px;">
      Hi${name ? ' ' + name : ''}, we're thrilled to have you join our community.
    </p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="font-size: 16px; margin-bottom: 18px; text-align: center;">
      Your account has been created successfully. You now have access to all the features Dionysus offers.
    </p>
    ${couponSection}
    <a href="https://dionysus-gray.vercel.app/dashboard" style="display: block; width: fit-content; margin: 0 auto 24px auto; padding: 14px 32px; background: linear-gradient(90deg,#2563eb 0%,#6366f1 100%); color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 17px; box-shadow: 0 1px 4px rgba(37,99,235,0.08);">Go to Dashboard</a>
    <p style="font-size: 15px; color: #6b7280; margin-bottom: 24px; text-align: center;">
      If you <strong>did not</strong> create this account, please <a href="https://dionysus-gray.vercel.app/support" style="color: #dc2626; text-decoration: underline;">contact support immediately</a>.
    </p>
    <div style="background: #e0f2fe; padding: 16px 20px; border-radius: 8px; color: #0369a1; margin-bottom: 24px; text-align: center;">
      <b>Need help?</b> Visit our <a href="https://dionysus-gray.vercel.app/support" style="color: #2563eb; text-decoration: underline;">Support Center</a> or reply to this email.
    </div>
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
