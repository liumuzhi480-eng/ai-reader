import localforage from 'localforage';
import { useEffect, useState } from 'react';

import { useRef, useState } from "react";
import { trpc } from "@/providers/trpc";
import type { BookMeta } from "../App";
import AddBookSheet from "../components/AddBookSheet";

function CoverThumb({ title }: { title: string }) {
  return (
    <div
      className="flex h-[62px] w-[46px] shrink-0 items-center justify-center"
      style={{
        background: "var(--paper-deep)",
        border: "1px solid var(--line)",
      }}
    >
      <span
        className="font-serif-cn"
        style={{ fontSize: 22, fontWeight: 600, color: "var(--ink-2)" }}
      >
        {title.replace(/[《》\s·].*$/, "").slice(0, 1)}
      </span>
    </div>
  );
}

export default function Shelf({ onOpenBook }: { onOpenBook: (b: BookMeta) => void }) {
    const [books, setBooks] = useState([]);
  const isLoading = false; // 离线秒开，不需要加载中状态

  // 1. 页面打开时，从手机本地读取书籍
  useEffect(() => {
    localforage.getItem('offline_books').then(res => {
      if (res) {
        setBooks(res);
      }
    });
  }, []);

  // 2. 离线删除书籍的功能（防止你长按删除时报错）
  const remove = {
    mutate: async ({ id }) => {
      const newBooks = books.filter(b => b.id !== id);
      await localforage.setItem('offline_books', newBooks);
      setBooks(newBooks);
    }
  };


  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startPress = (id: number) => {
    pressTimer.current = setTimeout(() => setConfirmId(id), 550);
  };
  const cancelPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const today = new Date().toLocaleDateString("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar">
      {/* 页眉 */}
      <header className="view-enter flex items-end justify-between px-6 pb-5 pt-9">
        <div>
          <p className="caps-label" style={{ color: "var(--ink-3)" }}>
            Library · {today}
          </p>
          <h1
            className="font-serif-cn mt-2"
            style={{ fontSize: 30, fontWeight: 600, letterSpacing: "0.1em" }}
          >
            书架
          </h1>
        </div>
        <button
          onClick={() => setSheetOpen(true)}
          aria-label="添加书籍"
          className="flex h-10 w-10 items-center justify-center transition-transform duration-300 ease-out-expo active:scale-90"
          style={{ border: "1px solid var(--ink)", color: "var(--ink)" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </header>

      {/* 书籍列表 */}
      <div className="view-enter-d1 flex-1 px-6">
        {isLoading && (
          <div className="space-y-4 pt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="shimmer-line h-[62px] w-[46px]" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="shimmer-line h-4 w-2/3" />
                  <div className="shimmer-line h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && books?.length === 0 && (
          <div className="flex flex-col items-center pt-24 text-center">
            <p className="font-serif-cn text-[15px]" style={{ color: "var(--ink-3)" }}>
              架上还空着
            </p>
            <p className="mt-2 text-[12px]" style={{ color: "var(--ink-3)" }}>
              点右上角 +，导入一本书开始
            </p>
          </div>
        )}

        <ul>
          {books?.map((b, i) => (
            <li key={b.id}>
              <button
                onClick={() => onOpenBook({ id: b.id, title: b.title, author: b.author })}
                onMouseDown={() => startPress(b.id)}
                onMouseUp={cancelPress}
                onMouseLeave={cancelPress}
                onTouchStart={() => startPress(b.id)}
                onTouchEnd={cancelPress}
                className="group flex w-full items-center gap-4 py-4 text-left transition-opacity duration-300 active:opacity-60"
                style={{
                  borderTop: i === 0 ? "none" : "1px solid var(--line)",
                  animation: `rise-in 0.55s cubic-bezier(0.22,1,0.36,1) ${0.05 * i + 0.1}s both`,
                }}
              >
                <CoverThumb title={b.title} />
                <div className="min-w-0 flex-1">
                  <p className="font-serif-cn truncate text-[16px]" style={{ fontWeight: 600 }}>
                    {b.title}
                  </p>
                  <p className="mt-1 text-[11.5px]" style={{ color: "var(--ink-3)" }}>
                    {b.author || "佚名"} · {(b.size / 1000).toFixed(1)} 千字
                    {b.source === "source" && b.sourceName ? ` · 来自${b.sourceName}` : ""}
                    {b.progress > 0.005 && (
                      <span style={{ color: "var(--cinnabar)" }}>
                        {" "}· 读至 {Math.round(b.progress * 100)}%
                      </span>
                    )}
                  </p>
                </div>
                <svg
                  width="7"
                  height="12"
                  viewBox="0 0 7 12"
                  fill="none"
                  className="shrink-0 transition-transform duration-500 ease-out-expo group-hover:translate-x-1"
                >
                  <path d="M1 1l5 5-5 5" stroke="var(--ink-3)" strokeWidth="1.2" />
                </svg>
              </button>
            </li>
          ))}
        </ul>

        {books && books.length > 0 && (
          <p className="py-6 text-center text-[10.5px]" style={{ color: "var(--ink-3)" }}>
            长按可移除书籍
          </p>
        )}
      </div>

      {/* 添加书籍 */}
      {sheetOpen && <AddBookSheet onClose={() => setSheetOpen(false)} />}

      {/* 删除确认 */}
      {confirmId !== null && (
        <div
          className="absolute inset-0 z-40 flex items-end justify-center"
          style={{ background: "rgba(22,20,15,0.35)" }}
          onClick={() => setConfirmId(null)}
        >
          <div
            className="view-enter mb-10 w-[78%] p-5"
            style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-serif-cn text-[14.5px]" style={{ fontWeight: 600 }}>
              移除这本书？
            </p>
            <p className="mt-1.5 text-[12px]" style={{ color: "var(--ink-3)" }}>
              已生成的书摘卡片会保留。
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 py-2.5 text-[13px]"
                style={{ border: "1px solid var(--line)", color: "var(--ink-2)" }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  remove.mutate({ id: confirmId });
                  setConfirmId(null);
                }}
                className="flex-1 py-2.5 text-[13px]"
                style={{ background: "var(--cinnabar)", color: "#faf8f3" }}
              >
                移除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
