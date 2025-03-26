import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  json,
  boolean,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
});

export const ideasTable = pgTable("ideas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  targetAudience: text("target_audience"),
  potentialFeatures: json("potential_features").$type<string[]>(),
  validationSteps: json("validation_steps").$type<string[]>(),
  implementationComplexity: json("implementation_complexity").$type<{
    technical?: string;
    market?: string;
    timeToMvp?: string;
  }>(),
  tags: json("tags").$type<string[]>(),
  isPublic: boolean("is_public").notNull().default(false),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .$onUpdate(() => new Date()),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;
export type InsertIdea = typeof ideasTable.$inferInsert;
export type SelectIdea = typeof ideasTable.$inferSelect;

// Add types that match frontend interfaces
export type NewIdea = Omit<InsertIdea, "id" | "createdAt" | "updatedAt">;
export type Idea = SelectIdea;
