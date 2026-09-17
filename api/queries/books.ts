import { desc, eq } from "drizzle-orm";
import { books } from "@db/schema";
import { getDb } from "./connection";

export function listBooks() {
  return getDb().select().from(books).orderBy(desc(books.createdAt));
}

export function getBook(id: number) {
  return getDb().select().from(books).where(eq(books.id, id)).limit(1);
}

export function createBook(input: {
  title: string;
  author: string;
  source: "local" | "source";
  sourceName?: string;
  content: string;
}) {
  return getDb().insert(books).values(input);
}

export function deleteBook(id: number) {
  return getDb().delete(books).where(eq(books.id, id));
}

export function updateProgress(id: number, progress: number) {
  return getDb().update(books).set({ progress }).where(eq(books.id, id));
}
