import { useState } from "react";
import Shelf from "./views/Shelf";
import Reader from "./views/Reader";
import Studio from "./views/Studio";
import Cards from "./views/Cards";

export interface BookMeta {
  id: number;
  title: string;
  author: string;
}

type View =
  | { name: "shelf" }
  | { name: "reader"; book: BookMeta }
  | { name: "studio"; book: BookMeta; excerpt: string }
  | { name: "cards" };

export default function App() {
  const [view, setView] = useState<View>({ name: "shelf" });
  const [cardsKey, setCardsKey] = useState(0);

  const tab = view.name === "cards" ? "cards" : "shelf";

  return (
    <div className="desk-backdrop flex min-h-[100dvh] items-center justify-center">
      {/* 桌面端侧栏水印 */}
      <div className="pointer-events-none mr-14 hidden select-none lg:block">
        <p className="caps-label" style={{ color: "var(--ink-3)" }}>
          Paper Isle
        </p>
        <h1
          className="font-serif-cn mt-3"
          style={{ fontSize: 44, fontWeight: 600, letterSpacing: "0.12em" }}
        >
          纸屿
        </h1>
        <p className="mt-4 max-w-[200px] text-[12px] leading-6" style={{ color: "var(--ink-3)" }}>
          本地阅读器 · 划选原文，AI 为你落成一张书摘卡片
        </p>
      </div>

      {/* 手机机身 */}
      <div
        className="relative flex h-[100dvh] w-full flex-col overflow-hidden sm:h-[min(860px,94vh)] sm:w-[400px] sm:rounded-[2.4rem] sm:border sm:shadow-[0_40px_80px_-30px_rgba(22,20,15,0.35)]"
        style={{ background: "var(--paper)", borderColor: "var(--line)" }}
      >
        <div className="min-h-0 flex-1">
          {view.name === "shelf" && (
            <Shelf
              onOpenBook={(book) => setView({ name: "reader", book })}
            />
          )}
          {view.name === "reader" && (
            <Reader
              book={view.book}
              onBack={() => setView({ name: "shelf" })}
              onPick={(excerpt) =>
                setView({ name: "studio", book: view.book, excerpt })
              }
            />
          )}
          {view.name === "studio" && (
            <Studio
              book={view.book}
              excerpt={view.excerpt}
              onBack={() => setView({ name: "reader", book: view.book })}
              onSaved={() => {
                setCardsKey((k) => k + 1);
                setView({ name: "cards" });
              }}
            />
          )}
          {view.name === "cards" && <Cards refreshKey={cardsKey} />}
        </div>

        {/* 底部导航：只有两个入口，不多不少 */}
        {(view.name === "shelf" || view.name === "cards") && (
          <nav className="hairline-t flex shrink-0" style={{ background: "var(--paper)" }}>
            {(
              [
                { key: "shelf", en: "Shelf", cn: "书架" },
                { key: "cards", en: "Cards", cn: "书摘" },
              ] as const
            ).map((item) => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setView(item.key === "cards" ? { name: "cards" } : { name: "shelf" })}
                  className="flex flex-1 flex-col items-center gap-[3px] py-3"
                >
                  <span
                    className="caps-label"
                    style={{ color: active ? "var(--cinnabar)" : "var(--ink-3)" }}
                  >
                    {item.en}
                  </span>
                  <span
                    className="font-serif-cn text-[14px]"
                    style={{
                      fontWeight: active ? 600 : 400,
                      color: active ? "var(--ink)" : "var(--ink-3)",
                    }}
                  >
                    {item.cn}
                  </span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
