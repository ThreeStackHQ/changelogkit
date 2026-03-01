import { pgTable, text, uuid, timestamp, boolean, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  apiKey: text("api_key").notNull().unique(), // ck_live_...
  widgetColor: text("widget_color").notNull().default("#6366f1"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const entries = pgTable("entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(), // markdown
  category: text("category").notNull().default("feature"), // feature, fix, improvement, breaking
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tier: text("tier").notNull().default("free"),
  status: text("status").notNull().default("active"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailSubscribers = pgTable("email_subscribers", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name"),
  isConfirmed: boolean("is_confirmed").notNull().default(false),
  confirmToken: text("confirm_token").notNull(),
  unsubscribeToken: text("unsubscribe_token").notNull(),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueEmailPerProject: unique().on(table.projectId, table.email),
}));

export const emailSends = pgTable("email_sends", {
  id: uuid("id").primaryKey().defaultRandom(),
  entryId: uuid("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  subscriberEmail: text("subscriber_email").notNull(),
  status: text("status").notNull().default("sent"), // sent, failed, bounced
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, { fields: [projects.userId], references: [users.id] }),
  entries: many(entries),
  subscribers: many(emailSubscribers),
}));
export const entriesRelations = relations(entries, ({ one, many }) => ({
  project: one(projects, { fields: [entries.projectId], references: [projects.id] }),
  emailSends: many(emailSends),
}));
export const emailSubscribersRelations = relations(emailSubscribers, ({ one }) => ({
  project: one(projects, { fields: [emailSubscribers.projectId], references: [projects.id] }),
}));
export const emailSendsRelations = relations(emailSends, ({ one }) => ({
  entry: one(entries, { fields: [emailSends.entryId], references: [entries.id] }),
  project: one(projects, { fields: [emailSends.projectId], references: [projects.id] }),
}));

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Entry = typeof entries.$inferSelect;
export type NewEntry = typeof entries.$inferInsert;
export type EmailSubscriber = typeof emailSubscribers.$inferSelect;
export type NewEmailSubscriber = typeof emailSubscribers.$inferInsert;
export type EmailSend = typeof emailSends.$inferSelect;
