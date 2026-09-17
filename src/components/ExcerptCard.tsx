import { forwardRef } from "react";

export type CardTemplate = "paper" | "ink" | "letter" | "sketch" | "oil";

export interface ExcerptCardData {
  excerpt: string;
  title?: string;
  note?: string;
  mood?: string;
  bookTitle: string;
  bookAuthor?: string;
  date?: string;
  imageData?: string | null;
}

const DESIGN_W = 360;
const DESIGN_H = 480;

function excerptFontSize(len: number): number {
  if (len <= 50) return 20;
  if (len <= 110) return 17;
  if (len <= 200) return 14.5;
  if (len <= 320) return 13;
  return 12;
}

const THEME: Record<
  CardTemplate,
  { bg: string; fg: string; sub: string; line: string; label: string; accent: string }
> = {
  paper: {
    bg: "#faf8f3",
    fg: "#16140f",
    sub: "#8b857a",
    line: "#e6e1d6",
    label: "#8b857a",
    accent: "#b03a2e",
  },
  ink: {
    bg: "#16140f",
    fg: "#f5f1e8",
    sub: "rgba(245,241,232,0.55)",
    line: "rgba(245,241,232,0.16)",
    label: "rgba(245,241,232,0.45)",
    accent: "#d4705e",
  },
  letter: {
    bg: "#f4eee1",
    fg: "#16140f",
    sub: "#8b857a",
    line: "#ddd4c0",
    label: "#b03a2e",
    accent: "#b03a2e",
  },
  sketch: {
    bg: "#f6f2e9",
    fg: "#16140f",
    sub: "#6e6759",
    line: "rgba(22,20,15,0.14)",
    label: "#6e6759",
    accent: "#b03a2e",
  },
  oil: {
    bg: "#f3efe4",
    fg: "#16140f",
    sub: "#6e6759",
    line: "rgba(22,20,15,0.14)",
    label: "#6e6759",
    accent: "#b03a2e",
  },
};

export const TEMPLATE_META: { key: CardTemplate; label: string; group: "纯色" | "画意" }[] = [
  { key: "paper", label: "纸", group: "纯色" },
  { key: "ink", label: "墨", group: "纯色" },
  { key: "letter", label: "笺", group: "纯色" },
  { key: "sketch", label: "素描", group: "画意" },
  { key: "oil", label: "油画", group: "画意" },
];

export function isImageTemplate(t: CardTemplate) {
  return t === "sketch" || t === "oil";
}

/**
 * 书摘卡片：固定 360×480 设计稿尺寸，外部用 scale 缩放展示，
 * 导出图片时始终按原始尺寸渲染，保证清晰度。
 */
export const ExcerptCard = forwardRef<
  HTMLDivElement,
  { data: ExcerptCardData; template: CardTemplate }
>(function ExcerptCard({ data, template }, ref) {
  const t = THEME[template];
  const len = data.excerpt.length;
  const fs = excerptFontSize(len);
  const hasImage = isImageTemplate(template) && !!data.imageData;
  const date =
    data.date ??
    new Date()
      .toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
      .replace(/\//g, ".");

  return (
    <div
      ref={ref}
      style={{
        width: DESIGN_W,
        height: DESIGN_H,
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.line}`,
      }}
      className="relative flex flex-col overflow-hidden"
    >
      {/* 画意模板：AI 生图打底 + 纸色柔光罩 */}
      {hasImage && (
        <>
          <img
            src={data.imageData!}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            crossOrigin="anonymous"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                template === "sketch"
                  ? "linear-gradient(to bottom, rgba(246,242,233,0.72) 0%, rgba(246,242,233,0.55) 34%, rgba(246,242,233,0.86) 68%, rgba(246,242,233,0.96) 100%)"
                  : "linear-gradient(to bottom, rgba(243,239,228,0.68) 0%, rgba(243,239,228,0.5) 34%, rgba(243,239,228,0.85) 68%, rgba(243,239,228,0.96) 100%)",
            }}
          />
        </>
      )}

      {/* 笺模板：左侧朱砂竖线 */}
      {template === "letter" && (
        <div className="absolute left-0 top-0 h-full" style={{ width: 3, background: t.accent }} />
      )}

      <div className="relative flex h-full flex-col px-8 pb-7 pt-7">
        {/* 页眉 */}
        <div className="flex items-baseline justify-between">
          <span className="caps-label" style={{ color: t.label }}>
            Excerpt · 书摘
          </span>
          <span
            className="font-latin"
            style={{ fontSize: 12, color: t.sub, letterSpacing: "0.08em" }}
          >
            {date}
          </span>
        </div>

        <div className="mt-4" style={{ borderTop: `1px solid ${t.line}` }} />

        {/* 标题 */}
        {data.title ? (
          <h3
            className="font-serif-cn mt-5"
            style={{ fontSize: 21, fontWeight: 600, letterSpacing: "0.06em", lineHeight: 1.4 }}
          >
            {data.title}
          </h3>
        ) : null}

        {/* 原文 */}
        <div className="flex flex-1 items-center overflow-hidden py-4">
          <p
            className="font-serif-cn w-full"
            style={{
              fontSize: fs,
              lineHeight: 2.05,
              letterSpacing: "0.02em",
              textAlign: "justify",
            }}
          >
            {data.excerpt}
          </p>
        </div>

        {/* 批注 */}
        {data.note ? (
          <div className="mb-4 flex items-start gap-2.5">
            <span
              className="mt-[7px] shrink-0"
              style={{ width: 14, height: 1.5, background: t.accent }}
            />
            <p
              className="font-serif-cn"
              style={{ fontSize: 12.5, lineHeight: 1.9, color: t.sub, letterSpacing: "0.02em" }}
            >
              {data.note}
            </p>
          </div>
        ) : null}

        {/* 页脚 */}
        <div
          className="flex items-end justify-between pt-3"
          style={{ borderTop: `1px solid ${t.line}` }}
        >
          <div className="flex items-baseline gap-2">
            <span className="font-serif-cn" style={{ fontSize: 12.5, fontWeight: 500 }}>
              《{data.bookTitle}》
            </span>
            {data.bookAuthor ? (
              <span style={{ fontSize: 11, color: t.sub }}>{data.bookAuthor}</span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {data.mood ? (
              <span
                className="font-latin italic"
                style={{ fontSize: 12.5, color: t.sub, letterSpacing: "0.06em" }}
              >
                {data.mood}
              </span>
            ) : null}
            <span style={{ width: 7, height: 7, background: t.accent }} />
          </div>
        </div>
      </div>
    </div>
  );
});

/** 按容器宽度等比缩放卡片 */
export function ScaledCard({
  data,
  template,
  width,
}: {
  data: ExcerptCardData;
  template: CardTemplate;
  width: number;
}) {
  const scale = width / DESIGN_W;
  return (
    <div style={{ width, height: DESIGN_H * scale }} className="overflow-hidden">
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <ExcerptCard data={data} template={template} />
      </div>
    </div>
  );
}

export const CARD_SIZE = { w: DESIGN_W, h: DESIGN_H };
