import { useRef, useState } from "react";
import { trpc } from "@/providers/trpc";
import { SOURCE_BOOKS } from "../lib/sourceBooks";

type Tab = "local" | "source";

export default function AddBookSheet({ onClose }: { onClose: () => void }) {
  const utils = trpc.useUtils();
  const create = trpc.books.create.useMutation({
    onSuccess: () => {
      utils.books.list.invalidate();
      onClose();
    },
  });

  const [tab, setTab] = useState<Tab>("local");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "").trim();
      if (text.length < 10) {
        setError("文件内容太短，不像一本书");
        return;
      }
      setContent(text);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
      setError("");
    };
    reader.readAsText(file, "utf-8");
  };

  const submitLocal = () => {
    if (!title.trim()) return setError("给书起个名字");
    if (content.trim().length < 10) return setError("请导入 txt 文件或粘贴正文");
    create.mutate({
      title: title.trim(),
      author: author.trim(),
      source: "local",
      content: content.trim(),
    });
  };

  const addFromSource = (index: number) => {
    const b = SOURCE_BOOKS[index];
    create.mutate({
      title: b.title,
      author: b.author,
      source: "source",
      sourceName: b.sourceName,
      content: b.content,
    });
  };

  return (
    <div
      className="absolute inset-0 z-30 flex items-end"
      style={{ background: "rgba(22,20,15,0.35)" }}
      onClick={onClose}
    >
      <div
        className="view-enter max-h-[82%] w-full overflow-y-auto no-scrollbar px-6 pb-8 pt-5"
        style={{ background: "var(--paper)", borderTop: "1px solid var(--line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-5 h-[3px] w-9" style={{ background: "var(--line)" }} />

        {/* 选项卡 */}
        <div className="flex gap-6">
          {(
            [
              { key: "local", label: "本地导入" },
              { key: "source", label: "添加书源" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="font-serif-cn pb-2 text-[15px]"
              style={{
                fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? "var(--ink)" : "var(--ink-3)",
                borderBottom: tab === t.key ? "1.5px solid var(--cinnabar)" : "1.5px solid transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "local" ? (
          <div className="pt-5">
            <input
              ref={fileRef}
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 py-7 transition-colors duration-300"
              style={{ border: "1px dashed var(--ink-3)", color: "var(--ink-2)" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5M4 16.5h12"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-[13px]">选择 txt 文件</span>
              {content && (
                <span className="text-[11px]" style={{ color: "var(--cinnabar)" }}>
                  已读取 {(content.length / 1000).toFixed(1)} 千字
                </span>
              )}
            </button>

            <div className="mt-4 flex gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="书名"
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[13px] outline-none placeholder:text-[var(--ink-3)]"
                style={{ border: "1px solid var(--line)" }}
              />
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="作者"
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[13px] outline-none placeholder:text-[var(--ink-3)]"
                style={{ border: "1px solid var(--line)" }}
              />
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="或直接粘贴正文……"
              rows={4}
              className="font-serif-cn mt-3 w-full resize-none bg-transparent px-3 py-2.5 text-[13px] leading-6 outline-none placeholder:text-[var(--ink-3)]"
              style={{ border: "1px solid var(--line)" }}
            />

            {error && (
              <p className="mt-2 text-[12px]" style={{ color: "var(--cinnabar)" }}>
                {error}
              </p>
            )}

            <button
              onClick={submitLocal}
              disabled={create.isPending}
              className="mt-4 w-full py-3 text-[13.5px] tracking-[0.2em] transition-opacity disabled:opacity-50"
              style={{ background: "var(--ink)", color: "var(--paper)" }}
            >
              {create.isPending ? "上架中…" : "放上书架"}
            </button>
          </div>
        ) : (
          <div className="pt-5">
            <p className="text-[12px] leading-5" style={{ color: "var(--ink-3)" }}>
              演示书源 · 安卓正式版中可添加任意网络书源，这里以公版书库为例：
            </p>
            <ul className="mt-4">
              {SOURCE_BOOKS.map((b, i) => (
                <li
                  key={b.title}
                  style={{ borderTop: i === 0 ? "1px solid var(--line)" : undefined, borderBottom: "1px solid var(--line)" }}
                >
                  <button
                    onClick={() => addFromSource(i)}
                    disabled={create.isPending}
                    className="flex w-full items-center justify-between py-4 text-left active:opacity-60"
                  >
                    <div>
                      <p className="font-serif-cn text-[15px]" style={{ fontWeight: 600 }}>
                        《{b.title}》
                        <span className="ml-2 text-[12px] font-normal" style={{ color: "var(--ink-3)" }}>
                          {b.author}
                        </span>
                      </p>
                      <p className="mt-1 text-[11.5px]" style={{ color: "var(--ink-3)" }}>
                        {b.intro}
                      </p>
                    </div>
                    <span className="caps-label shrink-0" style={{ color: "var(--cinnabar)" }}>
                      + Add
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
