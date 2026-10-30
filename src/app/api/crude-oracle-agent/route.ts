import { NextResponse } from "next/server";
import { getPublishedPrices } from "@/lib/published-prices";
import {
  CRUDE_ORACLE_INTERACTIVE_FOOTER,
  CRUDE_ORACLE_MANDATORY_DISCLAIMER,
  CRUDE_ORACLE_MASTER_SYSTEM_PROMPT,
  CRUDE_ORACLE_PROMPT_VERSION,
  CRUDE_ORACLE_QUICK_PROMPTS,
  buildDeskContextBlock,
  classifyQueryTopic,
  generateDeskLeadResponse,
  inferSessionFocus,
  isPersonalizedAdviceRequest,
  type AgentChatMessage,
} from "@/lib/crude-oracle-agent";

function usableXaiKey(): string | null {
  const key = (process.env.XAI_API_KEY ?? "").trim();
  if (!key || key === "replace_me" || key === "REPLACE_ME" || key === "changeme") {
    return null;
  }
  return key;
}

export async function GET() {
  const feed = await getPublishedPrices();
  const initial = generateDeskLeadResponse(
    "Give me today's crude & gas market snapshot and key drivers.",
    feed,
    []
  );
  return NextResponse.json({
    agent: "CrudeOracle",
    role: "Desk Lead",
    promptVersion: CRUDE_ORACLE_PROMPT_VERSION,
    systemPrompt: CRUDE_ORACLE_MASTER_SYSTEM_PROMPT,
    eiaLive: feed.eia,
    quickOptions: CRUDE_ORACLE_QUICK_PROMPTS,
    initialBriefing: initial,
  });
}

export async function POST(req: Request) {
  let body: { message?: unknown; history?: unknown } = {};
  try {
    body = (await req.json()) as { message?: unknown; history?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "Query message is required." }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "Query message must be under 2,000 characters." }, { status: 400 });
  }

  const rawHistory = Array.isArray(body.history) ? body.history : [];
  const history: AgentChatMessage[] = rawHistory
    .filter(
      (item): item is { role: "user" | "assistant"; content: string } =>
        Boolean(item) &&
        typeof item === "object" &&
        ((item as { role?: unknown }).role === "user" || (item as { role?: unknown }).role === "assistant") &&
        typeof (item as { content?: unknown }).content === "string"
    )
    .slice(-8);

  const feed = await getPublishedPrices();

  // Always enforce the deterministic guardrail for personalised advice requests
  if (isPersonalizedAdviceRequest(message)) {
    return NextResponse.json(generateDeskLeadResponse(message, feed, history));
  }

  const xaiKey = usableXaiKey();
  if (xaiKey) {
    try {
      const base = (process.env.XAI_API_BASE ?? "https://api.x.ai/v1").replace(/\/$/, "");
      const model = process.env.XAI_MODEL ?? "grok-4";
      const contextBlock = buildDeskContextBlock(feed);
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${xaiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.25,
          stream: false,
          messages: [
            {
              role: "system",
              content: `${CRUDE_ORACLE_MASTER_SYSTEM_PROMPT}\n\n---\nVerified Desk Data Layer (inject into Market Snapshot & Citations):\n${contextBlock}`,
            },
            ...history.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: message },
          ],
        }),
      });

      if (res.ok) {
        const json = (await res.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        let text = json?.choices?.[0]?.message?.content?.trim() ?? "";
        if (text) {
          if (!text.includes("Information only — not investment advice")) {
            text += `\n\n---\n\n**Disclaimer:** ${CRUDE_ORACLE_MANDATORY_DISCLAIMER}`;
          }
          if (!text.includes("Next?")) {
            text += `\n\n**${CRUDE_ORACLE_INTERACTIVE_FOOTER}**`;
          }
          return NextResponse.json({
            reply: text,
            topic: classifyQueryTopic(message),
            focus: inferSessionFocus(history, message),
            model,
            eiaLive: feed.eia,
            promptVersion: CRUDE_ORACLE_PROMPT_VERSION,
            quickOptions: CRUDE_ORACLE_QUICK_PROMPTS,
          });
        }
      }
    } catch {
      // Fall through to deterministic desk engine if xAI is unreachable
    }
  }

  return NextResponse.json(generateDeskLeadResponse(message, feed, history));
}
