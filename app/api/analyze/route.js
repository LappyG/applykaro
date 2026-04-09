import { NextResponse } from "next/server";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(request) {
  try {
    const { systemPrompt, userMessage } = await request.json();

    if (!systemPrompt || !userMessage) {
      return NextResponse.json({ error: "Missing input" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured. Set ANTHROPIC_API_KEY in your environment." },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("Anthropic API error:", response.status, errText);
      return NextResponse.json(
        { error: `AI service error (${response.status})` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const rawText = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    let jsonStr = rawText;
    jsonStr = jsonStr.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      console.error("Invalid JSON from AI:", jsonStr.slice(0, 300));
      return NextResponse.json(
        { error: "AI returned invalid response. Please try again." },
        { status: 500 }
      );
    }

    jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);

    try {
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json(parsed);
    } catch (e) {
      console.error("JSON parse failed:", e.message, jsonStr.slice(0, 300));
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
