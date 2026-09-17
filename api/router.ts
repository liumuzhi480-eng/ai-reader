import { createRouter, publicQuery } from "./middleware";
import { aiRouter } from "./ai";
import { booksRouter } from "./books";
import { cardsRouter } from "./cards";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  ai: aiRouter,
  books: booksRouter,
  cards: cardsRouter,
});

export type AppRouter = typeof appRouter;
