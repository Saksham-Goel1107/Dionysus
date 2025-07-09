import { NextResponse } from "next/server";

const SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY

export async function POST(req: Request) {
  const { token } = await req.json();

  if (!token || !SECRET_KEY) {
    return NextResponse.json({ success: false, error: "Missing token or secret key" }, { status: 400 });
  }

  const params = new URLSearchParams();
  params.append("secret", SECRET_KEY);
  params.append("response", token);

  const verifyRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await verifyRes.json();
  if (data.success && data.score && data.score > 0.6) {
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: "reCAPTCHA score too low" }, { status: 403 });
}
