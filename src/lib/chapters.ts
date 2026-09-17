export interface Chapter {
  title: string;
  text: string;
}

const HEADING_RE =
  /^第[一二三四五六七八九十百千零〇0-9]{1,6}[回章节卷部篇][\s　].{0,40}$/;

/** 把整本书按章回标题切分；切不出章节时视为单章 */
export function splitChapters(content: string, fallbackTitle: string): Chapter[] {
  const lines = content.split("\n");
  const chapters: Chapter[] = [];
  let current: Chapter | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (HEADING_RE.test(trimmed)) {
      if (current) chapters.push(current);
      current = { title: trimmed, text: "" };
    } else if (current) {
      current.text += line + "\n";
    } else if (trimmed) {
      // 标题之前的内容，归入"卷首"
      if (!current) current = { title: "卷首", text: "" };
      current.text += line + "\n";
    }
  }
  if (current) chapters.push(current);

  const valid = chapters.filter((c) => c.text.trim().length > 0);
  if (valid.length <= 1) {
    return [{ title: fallbackTitle, text: content }];
  }
  return valid;
}
