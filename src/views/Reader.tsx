import localforage from 'localforage';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';

import { trpc } from "@/providers/trpc";
import type { BookMeta } from "../App";
import { splitChapters } from "../lib/chapters";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type ReaderSettings,
} from "../lib/readerSettings";

interface Bubble {
  x: number;
  y: number;
  text: string;
}

const FONT_SIZES = [15, 16.5, 18.5];
const LINE_HEIGHTS = [1.8, 2.1, 2.4];

export default function Reader({
  book,
  onBack,
  onPick,
}: {
  book: BookMeta;
  onBack: () => void;
  onPick: (excerpt: string) => void;
}) {
    const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 打开阅读器时，从本地查出这本书的具体内容
  useEffect(() => {
    localforage.getItem('offline_books').then((books) => {
      if (books) {
        const currentBook = books.find(b => b.id === book.id);
        setData(currentBook || null);
      }
      setIsLoading(false);
    });
  }, [book.id]);

  // 2. 模拟原本的保存进度函数，改为存入本地
  const saveProgress = {
    mutate: async ({ id, progress }) => {
      const books = await localforage.getItem('offline_books') || [];
      const updatedBooks = books.map(b => b.id === id ? { ...b, progress } : b);
      await localforage.setItem('offline_books', updatedBooks);
    }
  };

  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<ReaderSettings>(loadSettings);
  const [progress, setProgress] = useState(0);
  const [activeChapter, setActiveChapter] = useState(0);

  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const restoredRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const chapters = data?.chapters || (data?.content ? [{ title: "正文", content: data.content }] : []);


  // 恢复上次阅读位置
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !data || restoredRef.current) return;
    restoredRef.current = true;
    const p = data.progress ?? 0;
    if (p > 0.005) {
      requestAnimationFrame(() => {
        el.scrollTop = p * (el.scrollHeight - el.clientHeight);
        setProgress(p);
      });
    }
  }, [data]);

  const updateSettings = (patch: Partial<ReaderSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setBubble(null);
    const max = el.scrollHeight - el.clientHeight;
    const p = max > 0 ? Math.min(el.scrollTop / max, 1) : 0;
    setProgress(p);

    // 当前章节：最后一个越过视口顶部的章节锚点
    const top = el.scrollTop + 80;
    let idx = 0;
    chapterRefs.current.forEach((node, i) => {
      if (node && node.offsetTop <= top) idx = i;
    });
    setActiveChapter(idx);

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveProgress.mutate({ id: book.id, progress: p });
    }, 900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id]);

  const jumpToChapter = (i: number) => {
    const node = chapterRefs.current[i];
    const el = scrollRef.current;
    if (node && el) {
      el.scrollTo({ top: node.offsetTop - 12, behavior: "smooth" });
    }
    setTocOpen(false);
  };

  const captureSelection = useCallback(() => {
    setTimeout(() => {
      const sel = window.getSelection();
      const body = bodyRef.current;
      if (!sel || sel.isCollapsed || !body) {
        setBubble(null);
        return;
      }
      const raw = sel.toString().replace(/\n{3,}/g, "\n\n").trim();
      if (raw.length < 4 || raw.length > 600) {
        setBubble(null);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!body.contains(range.commonAncestorContainer)) {
        setBubble(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      const host = scrollRef.current!.getBoundingClientRect();
      setBubble({
        x: Math.min(Math.max(rect.left - host.left + rect.width / 2, 90), host.width - 90),
        y: rect.top - host.top + (scrollRef.current?.scrollTop ?? 0),
        text: raw,
      });
    }, 30);
  }, []);

  return (
    <div className="relative flex h-full flex-col">
      {/* 阅读进度条 */}
      <div className="absolute left-0 top-0 z-10 h-[2px] w-full" style={{ background: "var(--line)" }}>
        <div
          className="h-full transition-[width] duration-200"
          style={{ width: `${progress * 100}%`, background: "var(--cinnabar)" }}
        />
      </div>

      {/* 顶部栏 */}
      <header className="hairline-b view-enter flex shrink-0 items-center px-5 py-4">
        <button
          onClick={onBack}
          aria-label="返回书架"
          className="flex h-8 w-8 items-center justify-center transition-transform duration-300 active:scale-90"
        >
          <svg width="9" height="15" viewBox="0 0 9 15" fill="none">
            <path d="M8 1L1.5 7.5 8 14" stroke="var(--ink)" strokeWidth="1.3" />
          </svg>
        </button>
        <div className="flex min-w-0 flex-1 flex-col items-center px-1">
          <span
            className="font-serif-cn max-w-full truncate text-[14.5px]"
            style={{ fontWeight: 600 }}
          >
            {chapters.length > 1 ? chapters[activeChapter]?.title : book.title}
          </span>
          <span className="caps-label mt-[3px]" style={{ color: "var(--ink-3)" }}>
            {book.author || "Reading"} · {Math.round(progress * 100)}%
          </span>
        </div>
        <div className="flex items-center gap-1">
          {chapters.length > 1 && (
            <button
              onClick={() => setTocOpen(true)}
              aria-label="目录"
              className="flex h-8 w-8 items-center justify-center transition-transform duration-300 active:scale-90"
            >
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <path d="M1 1h14M1 6h10M1 11h14" stroke="var(--ink)" strokeWidth="1.2" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="排版设置"
            className="flex h-8 w-8 items-center justify-center transition-transform duration-300 active:scale-90"
          >
            <span className="font-serif-cn text-[15px]" style={{ color: "var(--ink)" }}>
              Aa
            </span>
          </button>
        </div>
      </header>

      {/* 正文 */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative min-h-0 flex-1 overflow-y-auto no-scrollbar"
      >
        {isLoading ? (
          <div className="space-y-4 px-7 pt-10">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="shimmer-line h-4" style={{ width: `${92 - i * 9}%` }} />
            ))}
          </div>
        ) : (
          <div
            ref={bodyRef}
            onMouseUp={captureSelection}
            onTouchEnd={captureSelection}
            className="view-enter px-7 pb-28 pt-6"
            style={{ userSelect: "text", WebkitUserSelect: "text" }}
          >
            {chapters.map((ch, ci) => (
              <div
                key={ci}
                ref={(node) => {
                  chapterRefs.current[ci] = node;
                }}
              >
                {chapters.length > 1 && (
                  <h2
                    className="font-serif-cn mb-6 mt-2 text-center"
                    style={{
                      fontSize: settings.fontSize + 1.5,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      lineHeight: 1.8,
                    }}
                  >
                    {ch.title}
                  </h2>
                )}
                {ch.text
                  .split(/\n+/)
                  .filter(Boolean)
                  .map((p, i) => (
                    <p
                      key={i}
                      className={settings.serif ? "font-serif-cn" : ""}
                      style={{
                        fontSize: settings.fontSize,
                        lineHeight: settings.lineHeight,
                        letterSpacing: "0.015em",
                        textAlign: "justify",
                        marginBottom: "1.1em",
                        textIndent: p.length > 30 ? "2em" : undefined,
                        color: "var(--ink)",
                      }}
                    >
                      {p}
                    </p>
                  ))}
              </div>
            ))}

            <div className="mt-10 flex items-center justify-center gap-3">
              <span style={{ width: 24, height: 1, background: "var(--line)" }} />
              <span className="caps-label" style={{ color: "var(--ink-3)" }}>
                Fin
              </span>
              <span style={{ width: 24, height: 1, background: "var(--line)" }} />
            </div>
          </div>
        )}

        {/* 划选气泡 */}
        {bubble && (
          <div
            className="view-enter absolute z-20"
            style={{ left: bubble.x, top: Math.max(bubble.y - 52, 8), transform: "translateX(-50%)" }}
          >
            <button
              onClick={() => {
                window.getSelection()?.removeAllRanges();
                setBubble(null);
                onPick(bubble.text);
              }}
              className="flex items-center gap-2 whitespace-nowrap px-4 py-2.5 shadow-[0_10px_24px_-8px_rgba(22,20,15,0.4)] transition-transform duration-300 active:scale-95"
              style={{ background: "var(--ink)", color: "var(--paper)" }}
            >
              <span style={{ color: "var(--cinnabar)", fontSize: 13 }}>✦</span>
              <span className="text-[12.5px] tracking-[0.12em]">生成书摘</span>
            </button>
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <footer
        className="hairline-t pointer-events-none absolute bottom-0 left-0 right-0 flex justify-center py-3"
        style={{ background: "linear-gradient(to top, var(--paper) 70%, transparent)" }}
      >
        <p className="text-[10.5px] tracking-[0.15em]" style={{ color: "var(--ink-3)" }}>
          划选一段文字，生成书摘卡片
        </p>
      </footer>

      {/* 目录抽屉 */}
      {tocOpen && (
        <div
          className="absolute inset-0 z-30"
          style={{ background: "rgba(22,20,15,0.35)" }}
          onClick={() => setTocOpen(false)}
        >
          <div
            className="view-enter flex h-full w-[78%] flex-col px-6 pb-8 pt-9"
            style={{ background: "var(--paper)", borderRight: "1px solid var(--line)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="caps-label" style={{ color: "var(--ink-3)" }}>
              Contents
            </p>
            <h2 className="font-serif-cn mt-2 text-[22px]" style={{ fontWeight: 600 }}>
              目录
            </h2>
            <div className="mt-5 min-h-0 flex-1 overflow-y-auto no-scrollbar">
              {chapters.map((ch, i) => (
                <button
                  key={i}
                  onClick={() => jumpToChapter(i)}
                  className="w-full py-3.5 text-left transition-opacity active:opacity-60"
                  style={{ borderTop: i === 0 ? "none" : "1px solid var(--line)" }}
                >
                  <p
                    className="font-serif-cn text-[13.5px] leading-6"
                    style={{
                      fontWeight: i === activeChapter ? 600 : 400,
                      color: i === activeChapter ? "var(--cinnabar)" : "var(--ink-2)",
                    }}
                  >
                    {ch.title}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 排版设置 */}
      {settingsOpen && (
        <div
          className="absolute inset-0 z-30 flex items-end"
          style={{ background: "rgba(22,20,15,0.35)" }}
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className="view-enter w-full px-6 pb-9 pt-5"
            style={{ background: "var(--paper)", borderTop: "1px solid var(--line)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-6 h-[3px] w-9" style={{ background: "var(--line)" }} />

            {/* 字号 */}
            <div className="flex items-center justify-between">
              <span className="caps-label" style={{ color: "var(--ink-3)" }}>
                字号
              </span>
              <div className="flex" style={{ border: "1px solid var(--line)" }}>
                {FONT_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateSettings({ fontSize: s })}
                    className="px-4 py-2 transition-colors"
                    style={{
                      background: settings.fontSize === s ? "var(--ink)" : "transparent",
                      color: settings.fontSize === s ? "var(--paper)" : "var(--ink-2)",
                      fontSize: s === 15 ? 12 : s === 16.5 ? 14 : 16,
                    }}
                  >
                    A
                  </button>
                ))}
              </div>
            </div>

            {/* 行距 */}
            <div className="mt-5 flex items-center justify-between">
              <span className="caps-label" style={{ color: "var(--ink-3)" }}>
                行距
              </span>
              <div className="flex" style={{ border: "1px solid var(--line)" }}>
                {LINE_HEIGHTS.map((lh, i) => (
                  <button
                    key={lh}
                    onClick={() => updateSettings({ lineHeight: lh })}
                    className="px-4 py-2 text-[12px] transition-colors"
                    style={{
                      background: settings.lineHeight === lh ? "var(--ink)" : "transparent",
                      color: settings.lineHeight === lh ? "var(--paper)" : "var(--ink-2)",
                    }}
                  >
                    {["紧凑", "适中", "疏朗"][i]}
                  </button>
                ))}
              </div>
            </div>

            {/* 字体 */}
            <div className="mt-5 flex items-center justify-between">
              <span className="caps-label" style={{ color: "var(--ink-3)" }}>
                字体
              </span>
              <div className="flex" style={{ border: "1px solid var(--line)" }}>
                {[
                  { serif: true, label: "宋体" },
                  { serif: false, label: "黑体" },
                ].map((f) => (
                  <button
                    key={f.label}
                    onClick={() => updateSettings({ serif: f.serif })}
                    className={`px-4 py-2 text-[12.5px] transition-colors ${f.serif ? "font-serif-cn" : ""}`}
                    style={{
                      background: settings.serif === f.serif ? "var(--ink)" : "transparent",
                      color: settings.serif === f.serif ? "var(--paper)" : "var(--ink-2)",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => updateSettings({ ...DEFAULT_SETTINGS })}
              className="mt-6 w-full py-2.5 text-[12px]"
              style={{ color: "var(--ink-3)", border: "1px solid var(--line)" }}
            >
              恢复默认
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
