import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { trpc } from "@/providers/trpc";
import { ExcerptCard, ScaledCard, type CardTemplate } from "../components/ExcerptCard";

type CardRow = {
  id: number;
  bookTitle: string;
  bookAuthor: string;
  excerpt: string;
  title: string;
  note: string;
  mood: string;
  template: string;
  imageData: string | null;
  createdAt: Date;
};

function useColumnWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return { ref, width: w };
}

export default function Cards({ refreshKey }: { refreshKey: number }) {
  const utils = trpc.useUtils();
  const cardsQuery = trpc.cards.list.useQuery();
  const { data: cards, isLoading } = cardsQuery;
  useEffect(() => {
    cardsQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);
  const remove = trpc.cards.remove.useMutation({
    onSuccess: () => {
      utils.cards.list.invalidate();
      setActive(null);
    },
  });

  const [active, setActive] = useState<CardRow | null>(null);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const { ref: gridRef, width: gridW } = useColumnWidth();
  const colW = gridW > 0 ? (gridW - 12) / 2 : 164;

  const exportImage = async (card: CardRow) => {
    if (!exportRef.current || exporting) return;
    setExporting(true);
    try {
      const url = await toPng(exportRef.current, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement("a");
      a.href = url;
      a.download = `书摘·${card.bookTitle}.png`;
      a.click();
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-y-auto no-scrollbar">
      <header className="view-enter px-6 pb-5 pt-9">
        <p className="caps-label" style={{ color: "var(--ink-3)" }}>
          Collection · {cards?.length ?? 0} 张
        </p>
        <h1
          className="font-serif-cn mt-2"
          style={{ fontSize: 30, fontWeight: 600, letterSpacing: "0.1em" }}
        >
          书摘集
        </h1>
      </header>

      <div ref={gridRef} className="view-enter-d1 flex-1 px-5 pb-8">
        {isLoading && (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="shimmer-line aspect-[3/4]" />
            ))}
          </div>
        )}

        {!isLoading && cards?.length === 0 && (
          <div className="flex flex-col items-center pt-24 text-center">
            <p className="font-serif-cn text-[15px]" style={{ color: "var(--ink-3)" }}>
              还没有书摘
            </p>
            <p className="mt-2 max-w-[220px] text-[12px] leading-5" style={{ color: "var(--ink-3)" }}>
              去读一本书，划选打动你的段落，AI 会把它落成一张卡片
            </p>
          </div>
        )}

        {gridW > 0 && (
          <div className="columns-2 gap-3">
            {(cards as CardRow[] | undefined)?.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setActive(c)}
                className="mb-3 block w-full break-inside-avoid text-left transition-transform duration-300 ease-out-expo active:scale-[0.98]"
                style={{
                  animation: `rise-in 0.55s cubic-bezier(0.22,1,0.36,1) ${0.05 * i + 0.08}s both`,
                }}
              >
                <ScaledCard
                  data={{
                    excerpt: c.excerpt,
                    title: c.title,
                    note: c.note,
                    mood: c.mood,
                    bookTitle: c.bookTitle,
                    bookAuthor: c.bookAuthor,
                    imageData: c.imageData,
                    date: new Date(c.createdAt)
                      .toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
                      .replace(/\//g, "."),
                  }}
                  template={(c.template as CardTemplate) || "paper"}
                  width={colW}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 详情浮层 */}
      {active && (
        <div
          className="absolute inset-0 z-40 flex flex-col items-center justify-center px-8"
          style={{ background: "rgba(22,20,15,0.5)", backdropFilter: "blur(6px)" }}
          onClick={() => setActive(null)}
        >
          <div className="view-enter w-full max-w-[300px]" onClick={(e) => e.stopPropagation()}>
            <div className="shadow-[0_32px_64px_-24px_rgba(0,0,0,0.5)]">
              <ScaledCard
                data={{
                  excerpt: active.excerpt,
                  title: active.title,
                  note: active.note,
                  mood: active.mood,
                  bookTitle: active.bookTitle,
                  bookAuthor: active.bookAuthor,
                  imageData: active.imageData,
                  date: new Date(active.createdAt)
                    .toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
                    .replace(/\//g, "."),
                }}
                template={(active.template as CardTemplate) || "paper"}
                width={300}
              />
            </div>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => exportImage(active)}
                disabled={exporting}
                className="flex-1 py-2.5 text-[12.5px]"
                style={{ background: "var(--paper)", color: "var(--ink)" }}
              >
                {exporting ? "导出中…" : "导出图片"}
              </button>
              <button
                onClick={() => remove.mutate({ id: active.id })}
                className="flex-1 py-2.5 text-[12.5px]"
                style={{
                  border: "1px solid rgba(250,248,243,0.4)",
                  color: "#faf8f3",
                }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 隐藏的全尺寸卡片，用于导出高清图 */}
      {active && (
        <div className="pointer-events-none fixed -left-[2000px] top-0" aria-hidden>
          <ExcerptCard
            ref={exportRef}
            data={{
              excerpt: active.excerpt,
              title: active.title,
              note: active.note,
              mood: active.mood,
              bookTitle: active.bookTitle,
              bookAuthor: active.bookAuthor,
              imageData: active.imageData,
              date: new Date(active.createdAt)
                .toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
                .replace(/\//g, "."),
            }}
            template={(active.template as CardTemplate) || "paper"}
          />
        </div>
      )}
    </div>
  );
}
