import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import fsSync from "fs";

function waitForFile(filePath: string, timeout = 7000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (fsSync.existsSync(filePath)) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeout) {
        clearInterval(interval);
        reject(new Error("File generation timed out"));
      }
    }, 300);
  });
}

export async function POST(req: Request) {
  try {
    const { owner, repo } = await req.json();

    if (!owner || !repo) {
      return NextResponse.json({ error: "Missing owner or repo" }, { status: 400 });
    }

    const scriptPath = path.join(process.cwd(), "generate_diagram.py");
    const outputPath = path.join(process.cwd(), "diagram.png");

    return new Promise((resolve) => {
      const child = spawn("python", [scriptPath, owner, repo]);

      let stderr = "";

      child.stderr.on("data", (data) => (stderr += data.toString()));

      child.on("close", async (code) => {
        if (code !== 0) {
          console.error("Python script failed:", stderr);
          return resolve(
            NextResponse.json({ error: "Script failed", stderr }, { status: 500 })
          );
        }

        try {
          await waitForFile(outputPath, 7000);
          const fileBuffer = await fs.readFile(outputPath);
          return resolve(
            new NextResponse(new Uint8Array(fileBuffer), {
              status: 200,
              headers: {
                "Content-Type": "image/png",
                "Content-Disposition": `attachment; filename="${repo}_diagram.png"`,
              },
            })
          );
        } catch (err) {
          console.error("File wait error:", err);
          return resolve(
            NextResponse.json({ error: "Diagram generation timeout" }, { status: 500 })
          );
        }
      });
    });
  } catch (e) {
    console.error("Route error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
