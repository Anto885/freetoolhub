// /api/remove-bg.js
// remove.bg API — Global limit 50 per month for whole site (no IP checks)
// Requires: Vercel KV enabled & REMOVE_BG_KEY env var

import fetch from "node-fetch";

export const config = {
  runtime: "edge",
};

const KV_NAMESPACE = "freetoolhub_global_limit";

// Get "2025-11" style key to reset monthly limit
function getMonthKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
}

export default async function handler(req) {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "POST only" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.REMOVE_BG_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Missing REMOVE_BG_KEY environment variable",
        }),
        { status: 500 }
      );
    }

    const monthKey = getMonthKey();
    const usageKey = `${KV_NAMESPACE}:${monthKey}`;

    // Load KV
    const kv = await import("@vercel/kv");

    // Check global usage
    const used = (await kv.get(usageKey)) || 0;

    if (used >= 50) {
      return new Response(
        JSON.stringify({
          error: "Monthly limit of 50 remove.bg requests reached.",
        }),
        { status: 429 }
      );
    }

    // Parse uploaded file
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(JSON.stringify({ error: "File required" }), {
        status: 400,
      });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return new Response(JSON.stringify({ error: "Missing file" }), {
        status: 400,
      });
    }

    // Remove.bg request
    const bgForm = new FormData();
    bgForm.append("image_file", file);
    bgForm.append("size", "auto");

    const removeBgRes = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey,
      },
      body: bgForm,
    });

    if (!removeBgRes.ok) {
      const errText = await removeBgRes.text();
      return new Response(
        JSON.stringify({
          error: "remove.bg error",
          detail: errText,
        }),
        { status: 500 }
      );
    }

    const arrayBuff = await removeBgRes.arrayBuffer();

    // Increase global usage
    await kv.set(usageKey, used + 1);

    return new Response(arrayBuff, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'inline; filename="removed-bg.png"',
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: "Server error",
        detail: String(err),
      }),
      { status: 500 }
    );
  }
}
