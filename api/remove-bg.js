// /api/remove-bg.js
// remove.bg API — Global limit 50 per month for whole site
// RUNTIME MUST BE NODEJS (not edge)

import fetch from "node-fetch";
import { kv } from "@vercel/kv";

// Make sure we run on Node.js runtime
export const config = {
  runtime: "nodejs18.x",
};

// Returns "2025-11" monthly key
function getMonthKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "POST only" });
    }

    const apiKey = process.env.REMOVE_BG_KEY;
    if (!apiKey) {
      return res
        .status(500)
        .json({ error: "Missing REMOVE_BG_KEY environment variable" });
    }

    const monthKey = getMonthKey();
    const usageKey = `freetoolhub_global_limit:${monthKey}`;

    // load usage counter
    const used = (await kv.get(usageKey)) || 0;

    if (used >= 50) {
      return res
        .status(429)
        .json({ error: "Monthly limit of 50 images reached." });
    }

    // Parse uploaded file
    const form = await req.formData();
    const file = form.get("file");

    if (!file) {
      return res.status(400).json({ error: "Missing file" });
    }

    // Prepare request to remove.bg
    const bgForm = new FormData();
    bgForm.append("image_file", file);
    bgForm.append("size", "auto");

    const removeRes = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: bgForm,
    });

    if (!removeRes.ok) {
      const errText = await removeRes.text();
      return res.status(500).json({ error: "remove.bg error", detail: errText });
    }

    const buffer = Buffer.from(await removeRes.arrayBuffer());

    // increment usage
    await kv.set(usageKey, used + 1);

    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Content-Disposition",
      'inline; filename="removed-background.png"'
    );
    return res.send(buffer);
  } catch (err) {
    return res.status(500).json({
      error: "Server error",
      detail: String(err),
    });
  }
}
