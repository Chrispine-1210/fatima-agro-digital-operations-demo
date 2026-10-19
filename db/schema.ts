import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** Bounded presentation store; writes use an optimistic version to keep all ledgers consistent. */
export const portalState = sqliteTable("portal_state", {
  id: text("id").primaryKey(),
  revision: integer("revision").notNull().default(0),
  payload: text("payload").notNull(),
  updatedAt: text("updated_at").notNull(),
});
