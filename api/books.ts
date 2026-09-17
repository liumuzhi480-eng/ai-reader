import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { createBook, deleteBook, getBook, listBooks, updateProgress } from "./queries/books";

export const booksRouter = createRouter({
  list: publicQuery.query(async () => {
    const rows = await listBooks();
    // 列表不返回正文，避免一次性拉取大字段
    return rows.map(({ content, ...rest }) => ({
      ...rest,
      size: content.length,
    }));
  }),

  get: publicQuery.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const rows = await getBook(input.id);
    if (!rows[0]) throw new Error("书籍不存在");
    return rows[0];
  }),

  create: publicQuery
    .input(
      z.object({
        title: z.string().min(1).max(255),
        author: z.string().max(255).default(""),
        source: z.enum(["local", "source"]).default("local"),
        sourceName: z.string().max(255).optional(),
        content: z.string().min(10).max(2_000_000),
      }),
    )
    .mutation(async ({ input }) => {
      await createBook(input);
      return { ok: true };
    }),

  remove: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await deleteBook(input.id);
    return { ok: true };
  }),

  updateProgress: publicQuery
    .input(z.object({ id: z.number(), progress: z.number().min(0).max(1) }))
    .mutation(async ({ input }) => {
      await updateProgress(input.id, input.progress);
      return { ok: true };
    }),
});
