import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { createCard, deleteCard, listCards } from "./queries/cards";

export const cardsRouter = createRouter({
  list: publicQuery.query(() => listCards()),

  create: publicQuery
    .input(
      z.object({
        bookId: z.number(),
        bookTitle: z.string().max(255).default(""),
        bookAuthor: z.string().max(255).default(""),
        excerpt: z.string().min(1).max(1000),
        title: z.string().max(64).default(""),
        note: z.string().max(255).default(""),
        mood: z.string().max(64).default(""),
        template: z.string().max(32).default("paper"),
        imageData: z.string().max(8_000_000).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      await createCard(input);
      return { ok: true };
    }),

  remove: publicQuery.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await deleteCard(input.id);
    return { ok: true };
  }),
});
