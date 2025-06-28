import { sendInvoiceEmail } from '@/lib/email';

export async function sendPurchaseInvoice({
  to,
  credits,
  amount,
  date,
}: {
  to: string;
  credits: number;
  amount: string;
  date: string;
}) {
  const subject = `Invoice for your purchase of ${credits} credits`;

  const html = `
  <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background: #f9fafb;">
    <h2 style="color: #2563eb; text-align:center; margin-bottom: 0;">🧾 Payment Invoice</h2>
    <p style="text-align:center; color: #555; margin-top: 4px;">Thank you for your purchase from <b>Dionysus</b>!</p>
    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e0e0e0;" />
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; background: #fff; border-radius: 8px; overflow: hidden;">
      <tr style="background: #f1f5f9;">
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;"><strong>Credits Purchased</strong></td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${credits}</td>
      </tr>
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">Total Paid</td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #2563eb; font-weight: bold;">₹${amount}</td>
      </tr>
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">GST (18%) </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">Included</td>
      </tr>
      <tr>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">Processing Fee </td>
        <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">Included</td>
      </tr>
      <tr>
        <td style="padding: 10px 8px;">Date</td>
        <td style="padding: 10px 8px; text-align: right;">${date}</td>
      </tr>
    </table>
  <div style="margin-top:15px">          <b>Note:</b> If you received a discount or offer, the price you paid may be lower than the total price above. All discounts and offers are automatically applied at checkout and may not be reflected in the total paid above.
</div>
    <div style="margin-top: 32px; background: #e0f2fe; padding: 16px 20px; border-radius: 8px; color: #0369a1;">
      <b>How to use your credits?</b><br />
      Each credit allows you to index 1 file in a repository. For example, if your project has 100 files, you will need 100 credits to index it.<br />
      <span style="color: #2563eb;">You can view your credits and purchase history in your dashboard at any time.</span>
    </div>
    <p style="margin-top: 32px; color: #555;">If you have any questions, simply reply to this email. We're here to help!</p>
    <p style="font-size: 12px; color: #888; margin-top: 30px; text-align:center;">This is a system-generated invoice. No signature is required.<br />&copy; ${new Date().getFullYear()} Dionysus</p>
  </div>
  `;
  return sendInvoiceEmail({ to, subject, html });
}
