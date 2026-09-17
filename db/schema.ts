import {
  mysqlTable,
  mysqlEnum,
  serial,
  bigint,
  double,
  varchar,
  text,
  mediumtext,
  timestamp,
} from "drizzle-orm/mysql-core";

export const books = mysqlTable("books", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  author: varchar("author", { length: 255 }).notNull().default(""),
  source: mysqlEnum("source", ["local", "source"]).notNull().default("local"),
  sourceName: varchar("source_name", { length: 255 }),
  content: mediumtext("content").notNull(),
  progress: double("progress").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const cards = mysqlTable("cards", {
  id: serial("id").primaryKey(),
  bookId: bigint("book_id", { mode: "number", unsigned: true }).notNull(),
  bookTitle: varchar("book_title", { length: 255 }).notNull().default(""),
  bookAuthor: varchar("book_author", { length: 255 }).notNull().default(""),
  excerpt: text("excerpt").notNull(),
  title: varchar("title", { length: 64 }).notNull().default(""),
  note: varchar("note", { length: 255 }).notNull().default(""),
  mood: varchar("mood", { length: 64 }).notNull().default(""),
  template: varchar("template", { length: 32 }).notNull().default("paper"),
  imageData: mediumtext("image_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
