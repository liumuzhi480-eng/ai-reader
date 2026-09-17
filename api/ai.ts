import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";

const SYSTEM_PROMPT = `你是一位克制、有文学品位的书摘编辑。用户从一本书中划选了一段原文，你要为这段书摘生成卡片文案。

要求：
1. title：书摘小标题，4 到 8 个汉字，凝练、有画面感，取自或贴合原文意象，不堆砌辞藻。
2. note：一句批注，不超过 36 个汉字。必须紧扣原文的具体场景、人物或情绪来写，像懂书的人在页边写的一笔。禁止空泛的感悟，禁止"人生""岁月""时光""灵魂"这类大词，禁止鸡汤口吻。
3. mood：一个英文小写单词，概括这段文字的氛围（如 rain、dusk、farewell、silence）。
4. scene：一段英文短语（5 到 12 个单词），描述原文中最有画面感的一个具体场景，供 AI 绘画使用。只写具体物象（如 a small boat on calm water under moonlight），不要抽象概念，不要人物面部特写。

只输出一个 JSON 对象，不要输出任何其他内容，格式：{"title":"...","note":"...","mood":"...","scene":"..."}`;

type AiResult = { title: string; note: string; mood: string; scene: string };

async function callKimi(excerpt: string, bookTitle: string, author: string): Promise<AiResult> {
  const apiKey = process.env.KIMI_API_KEY;
  const apiBase = (process.env.KIMI_API_BASE || "https://api.kimi.com/coding").replace(/\/$/, "");
  if (!apiKey) throw new Error("AI 服务未配置");

  const res = await fetch(`${apiBase}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      authorization: `Bearer ${apiKey}`,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "kimi-k2",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `书名：《${bookTitle}》${author ? `，作者：${author}` : ""}\n\n划选原文：\n${excerpt}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AI 服务异常（${res.status}）${body.slice(0, 120)}`);
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = (data.content ?? [])
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text!)
    .join("\n");

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI 返回格式异常");

  const parsed = JSON.parse(match[0]) as Partial<AiResult>;
  return {
    title: String(parsed.title ?? "").slice(0, 12),
    note: String(parsed.note ?? "").slice(0, 60),
    mood: String(parsed.mood ?? "").toLowerCase().replace(/[^a-z-]/g, "").slice(0, 24),
    scene: String(parsed.scene ?? "").replace(/["\n]/g, " ").slice(0, 160),
  };
}

const STYLE_PROMPTS: Record<"sketch" | "oil", (scene: string) => string> = {
  sketch: (scene) =>
    `minimalist chinese ink sketch of ${scene}, sparse delicate line drawing, large areas of negative space, cream rice paper background, monochrome black ink, quiet literary mood, elegant and restrained, no text, no watermark, no frame`,
  oil: (scene) =>
    `muted oil painting of ${scene}, soft visible brushstrokes, desaturated quiet palette, minimalist composition with large empty areas, hazy atmospheric light, serene literary mood, no text, no watermark, no frame`,
};

async function generateCardImage(scene: string, style: "sketch" | "oil"): Promise<string> {
  const apiKey = process.env.KIMI_API_KEY;
  const gwBase = (process.env.KIMI_GW_BASE || "").replace(/\/$/, "");
  if (!apiKey || !gwBase) throw new Error("图片服务未配置");

  const res = await fetch(`${gwBase}/v1/tools`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      method: "generate_image",
      params: {
        description: STYLE_PROMPTS[style](scene || "an empty desk with an open book by a window"),
        ratio: "2:3",
        resolution: "1K",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`图片服务异常（${res.status}）${body.slice(0, 120)}`);
  }

  const raw = (await res.json()) as {
    media?: { url?: string };
    result?: { user?: Array<{ text?: string }> };
    error?: string;
  };
  if (raw.error) throw new Error(`图片生成失败：${raw.error}`);

  let url = raw.media?.url;
  if (!url) {
    const inner = raw.result?.user?.[0]?.text;
    if (inner) {
      try {
        url = (JSON.parse(inner) as { media?: { url?: string } }).media?.url;
      } catch {
        /* ignore */
      }
    }
  }
  if (!url) throw new Error("图片服务返回格式异常");

  // 拉取图片转为 data URL 持久保存，避免外链过期
  const imgRes = await fetch(url);
  if (!imgRes.ok) throw new Error("图片下载失败");
  const buf = Buffer.from(await imgRes.arrayBuffer());
  const mime = imgRes.headers.get("content-type") || "image/png";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export const aiRouter = createRouter({
  generateExcerpt: publicQuery
    .input(
      z.object({
        excerpt: z.string().min(4).max(600),
        bookTitle: z.string().max(255),
        author: z.string().max(255).default(""),
      }),
    )
    .mutation(async ({ input }) => {
      return callKimi(input.excerpt, input.bookTitle, input.author);
    }),

  generateCardImage: publicQuery
    .input(
      z.object({
        scene: z.string().max(200).default(""),
        style: z.enum(["sketch", "oil"]),
      }),
    )
    .mutation(async ({ input }) => {
      const imageData = await generateCardImage(input.scene, input.style);
      return { imageData };
    }),
});
