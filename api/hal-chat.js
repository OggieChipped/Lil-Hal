const DEFAULT_MODEL = "meta-llama/llama-3.2-1b-instruct:free";

function getPayload(req) {
  if (req.body?.payload) return req.body.payload;
  return req.body || {};
}

function normalizeContent(data) {
  return (
    data?.choices?.[0]?.message?.content ||
    data?.message?.content ||
    data?.response ||
    ""
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ message: { role: "assistant", content: "Only POST works here." } });
    return;
  }

  const apiKey = process.env.HAL_AI_API_KEY;
  const apiUrl = process.env.HAL_AI_API_URL || "https://openrouter.ai/api/v1/chat/completions";
  const model = process.env.HAL_AI_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    res.status(500).json({
      message: {
        role: "assistant",
        content: "I cannot reach the hosted AI yet. The web host needs HAL_AI_API_KEY set.",
      },
      done: true,
    });
    return;
  }

  const payload = getPayload(req);
  const body = {
    model,
    messages: payload.messages || [],
    temperature: payload.options?.temperature ?? 0.7,
    max_tokens: payload.options?.num_predict ?? 160,
    stream: false,
  };

  try {
    const upstream = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://github.com/OggieChipped/Lil-Hal",
        "X-Title": "Lil Hal",
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      res.status(upstream.status).json({
        message: {
          role: "assistant",
          content: data?.error?.message || "I could not reach the hosted AI. Spectacular infrastructure, truly.",
        },
        done: true,
      });
      return;
    }

    res.status(200).json({
      message: {
        role: "assistant",
        content: normalizeContent(data),
      },
      done: true,
    });
  } catch {
    res.status(500).json({
      message: {
        role: "assistant",
        content: "I could not reach the hosted AI. The internet has performed its little vanishing act.",
      },
      done: true,
    });
  }
}
