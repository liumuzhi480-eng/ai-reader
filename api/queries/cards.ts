import { desc, eq } from "drizzle-orm";
import { cards } from "@db/schema";
import { getDb } from "./connection";

export function listCards() {
  return getDb().select().from(cards).orderBy(desc(cards.createdAt));
}

export function createCard(input: {
  bookId: number;
  bookTitle: string;
  bookAuthor: string;
  excerpt: string;
  title: string;
  note: string;
  mood: string;
  template: string;
  imageData?: string;
}) {
  return getDb().insert(cards).values(input);
}

export function deleteCard(id: number) {
  return getDb().delete(cards).where(eq(cards.id, id));
}
