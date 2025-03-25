import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core"




export const userClicks = pgTable("user_clicks", {
    id: serial().primaryKey().notNull(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    qty: integer().notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const leaderboard = pgTable("leaderboard", {
    id: serial().primaryKey().notNull(),
    userId: varchar("user_id", { length: 255 }).notNull(),
    qty: integer().notNull(),
    position: integer().notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
    currentClick: integer().notNull(),
    lastClick: timestamp("last_click", { mode: 'string' }).defaultNow(),
    totalClicks: integer().notNull(),

});
