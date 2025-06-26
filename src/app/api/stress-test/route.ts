import { NextRequest, NextResponse } from "next/server";
import type { Instance, Result } from "autocannon";

export async function POST(req: NextRequest) {
  try {
    const { url, users } = await req.json();
    if (!url || !users) {
      return NextResponse.json({ error: "Missing url or users" }, { status: 400 });
    }

    let autocannon: typeof import("autocannon");
    try {
      autocannon = (await import("autocannon")).default;
    } catch (e) {
      return NextResponse.json({ error: "autocannon not installed or not supported in this environment." }, { status: 500 });
    }

    const result = await new Promise<Result>((resolve, reject) => {
      autocannon({
        url,
        connections: Math.min(users, 1000),
        amount: users,
        duration: 10,
      }, (err: Error | null, res: Result) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
    return NextResponse.json({
      latency: result.latency,
      requests: result.requests,
      throughput: result.throughput,
      errors: result.errors,
      non2xx: (result as any)["non2xx"],
      statusCodeStats: (result as any)["statusCodeStats"],
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
