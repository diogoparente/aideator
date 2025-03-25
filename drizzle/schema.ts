import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const clicks = pgTable("clicks", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	qty: integer().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});
