import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { trpc } from "@/providers/trpc";
import type { BookMeta } from "../App";
import {
  ExcerptCard,
  ScaledCard,
  TEMPLATE_META,
  isImageTemplate,
  type CardTemplate,
} from "../components/ExcerptCard";

const SWATCH: Record<CardTemplate, string> = {
  paper: "#faf8f3",
  ink: "#16140f",
  letter: "#f4eee1",
  sketch: "linear-gradient(135deg,#f6f2e9 55%,#c9c2b2)",
  oil: "linear-gradient(135deg,#e8e2d0,#a89f8a)",
};

export default function Studio({
  book,
  excerpt,
  onBack,
  onSaved,
}: {
  book: BookMeta;
  excerpt: string;
  onBack: () => void;
  onSaved: () => void;
}) {
  const generate = trpc.ai.generateExcerpt.useMutation();
  const genImage = trpc.ai.generateCardImage.useMutation();
  const save = trpc.cards.create.useMutation({ onSuccess: () => onSaved() });

  const [template, setTemplate] = useState<CardTemplate>("paper");
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageStyle, setImageStyle] = useState<"sketch" | "oil" | null>(null);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const askedRef = useRef(false);

  useEffect(() => {
    if (askedRef.current) return;
    askedRef.current = true;
    generate.mutate({ excerpt, bookTitle: book.title, author: book.author });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ai = generate.data;

  const pickTemplate = (t: CardTemplate) => {
    setTemplate(t);
    if (isImageTemplate(t)) {
      // 已有同风格图片则直接复用，否则重新生成
      if (imageStyle === t && imageData) return;
      setImageData(null);
      setImageStyle(t);
      genImage.mutate({ scene: ai?.scene ?? "", style: t });
    }
  };

  const cardData = {
    excerpt,
    title: ai?.title ?? "",
    note: ai?.note ?? "",
    mood: ai?.mood ?? "",
    bookTitle: book.title,
    bookAuthor: book.author,
    imageData: isImageTemplate(template) ? imageData : null,
  };

  const cardBusy =
    generate.isPending || (isImageTemplate(template) && (genImage.isPending || !imageData));

  const exportImage = async () => {
    if (!exportRef.current || exporting) return;
    setExporting(true);
    try {
      const url = await toPng(exportRef.current, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement("a");
      a.href = url;
      a.download = `书摘·${book.title}.png`;
      a.click();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      <header className="hairline-b view-enter flex shrink-0 items-center px-5 py-4">
        <button
          onClick={onBack}
          aria-label="返回阅读"
          className="flex h-8 w-8 items-center justify-center transition-transform duration-300 active:scale-90"
        >
          <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
            <path d="M8 1L1.5 7.5 8 14" stroke="var(--ink)" strokeWidth="1.3" />
          </svg>
        </button>
        <div className="flex flex-1 flex-col items-center">
          <span className="font-serif-cn text-[14.5px]" style={{ fontWeight: 600 }}>
            书摘卡片
          </span>
          <span className="caps-label mt-[3px]" style={{ color: "var(--ink-3)" }}>
            Card Studio
          </span>
        </div>
        <div className="w-8" />
      </header>

      <div className="flex flex-1 flex-col items-center px-8 pb-10 pt-7">
        {/* 卡片区 */}
        <div className="view-enter-d1 w-full max-w-[320px]">
          {generate.isPending ? (
            <div
              className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-4"
              style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
            >
              <span className="pulse-dot text-[18px]" style={{ color: "var(--cinnabar)" }}>
                ✦
              </span>
              <p className="font-serif-cn text-[13px]" style={{ color: "var(--ink-3)" }}>
                AI 正在品读原文
              </p>
              <div className="w-2/3 space-y-2.5 px-6">
                <div className="shimmer-line h-3 w-full" />
                <div className="shimmer-line h-3 w-4/5" />
                <div className="shimmer-line h-3 w-3/5" />
              </div>
            </div>
          ) : generate.isError ? (
            <div
              className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-4 px-8 text-center"
              style={{ border: "1px solid var(--line)" }}
            >
              <p className="font-serif-cn text-[13.5px]" style={{ color: "var(--ink-2)" }}>
                AI 暂时没有读懂这一段
              </p>
              <button
                onClick={() =>
                  generate.mutate({ excerpt, bookTitle: book.title, author: book.author })
                }
                className="px-5 py-2 text-[12.5px]"
                style={{ border: "1px solid var(--ink)", color: "var(--ink)" }}
              >
                再试一次
              </button>
            </div>
          ) : isImageTemplate(template) && genImage.isPending ? (
            <div
              className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-4"
              style={{ border: "1px solid var(--line)", background: "var(--paper)" }}
            >
              <span className="pulse-dot text-[18px]" style={{ color: "var(--cinnabar)" }}>
                ✦
              </span>
              <p className="font-serif-cn text-[13px]" style={{ color: "var(--ink-3)" }}>
                AI 正在以{template === "sketch" ? "素描" : "油画"}的笔法作画
              </p>
              <div className="shimmer-line h-24 w-24" style={{ borderRadius: "50%" }} />
            </div>
          ) : isImageTemplate(template) && genImage.isError && !imageData ? (
            <div
              className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-4 px-8 text-center"
              style={{ border: "1px solid var(--line)" }}
            >
              <p className="font-serif-cn text-[13.5px]" style={{ color: "var(--ink-2)" }}>
                这幅画没画成
              </p>
              <button
                onClick={() => genImage.mutate({ scene: ai?.scene ?? "", style: template as "sketch" | "oil" })}
                className="px-5 py-2 text-[12.5px]"
                style={{ border: "1px solid var(--ink)", color: "var(--ink)" }}
              >
                再画一次
              </button>
            </div>
          ) : (
            <div className="shadow-[0_24px_48px_-20px_rgba(22,20,15,0.3)]">
              <ScaledCard data={cardData} template={template} width={320} />
            </div>
          )}
        </div>

        {/* 模板切换：纯色 / 画意 两组 */}
        <div className="view-enter-d2 mt-7 w-full max-w-[320px]">
          {(["纯色", "画意"] as const).map((group) => (
            <div key={group} className="mt-3 first:mt-0">
              <p className="caps-label mb-2.5" style={{ color: "var(--ink-3)" }}>
                {group}
              </p>
              <div className="flex items-center gap-5">
                {TEMPLATE_META.filter((m) => m.group === group).map((m) => (
                  <button
                    key={m.key}
                    onClick={() => pickTemplate(m.key)}
                    className="flex flex-col items-center gap-2"
                  >
                    <span
                      className="flex h-9 w-9 items-center justify-center transition-transform duration-300 ease-out-expo"
                      style={{
                        background: SWATCH[m.key],
                        border:
                          template === m.key
                            ? "1.5px solid var(--cinnabar)"
                            : "1px solid var(--line)",
                        transform: template === m.key ? "scale(1.08)" : "scale(1)",
                      }}
                    />
                    <span
                      className="font-serif-cn text-[12px]"
                      style={{
                        color: template === m.key ? "var(--ink)" : "var(--ink-3)",
                        fontWeight: template === m.key ? 600 : 400,
                      }}
                    >
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 操作 */}
        <div className="view-enter-d2 mt-7 w-full max-w-[320px] space-y-3">
          <button
            onClick={() =>
              save.mutate({
                bookId: book.id,
                bookTitle: book.title,
                bookAuthor: book.author,
                excerpt,
                title: ai?.title ?? "",
                note: ai?.note ?? "",
                mood: ai?.mood ?? "",
                template,
                imageData: isImageTemplate(template) ? (imageData ?? undefined) : undefined,
              })
            }
            disabled={!ai || cardBusy || save.isPending}
            className="w-full py-3 text-[13.5px] tracking-[0.2em] transition-opacity disabled:opacity-40"
            style={{ background: "var(--ink)", color: "var(--paper)" }}
          >
            {save.isPending ? "收藏中…" : "收入书摘集"}
          </button>
          <div className="flex gap-3">
            <button
              onClick={exportImage}
              disabled={!ai || cardBusy || exporting}
              className="flex-1 py-3 text-[12.5px] transition-opacity disabled:opacity-40"
              style={{ border: "1px solid var(--line)", color: "var(--ink-2)" }}
            >
              {exporting ? "导出中…" : "导出图片"}
            </button>
            <button
              onClick={() =>
                generate.mutate({ excerpt, bookTitle: book.title, author: book.author })
              }
              disabled={generate.isPending}
              className="flex-1 py-3 text-[12.5px] transition-opacity disabled:opacity-40"
              style={{ border: "1px solid var(--line)", color: "var(--ink-2)" }}
            >
              换一版文案
            </button>
          </div>
        </div>
      </div>

      {/* 隐藏的全尺寸卡片，用于导出高清图 */}
      <div className="pointer-events-none fixed -left-[2000px] top-0" aria-hidden>
        <ExcerptCard ref={exportRef} data={cardData} template={template} />
      </div>
    </div>
  );
}
