import { pgTable, text, timestamp, primaryKey, index, unique } from "drizzle-orm/pg-core";

export const athanUsers = pgTable("athan_users", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  username: text("username").notNull().unique(),
  authToken: text("auth_token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const athanFriendships = pgTable(
  "athan_friendships",
  {
    userId: text("user_id")
      .notNull()
      .references(() => athanUsers.id, { onDelete: "cascade" }),
    friendId: text("friend_id")
      .notNull()
      .references(() => athanUsers.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.friendId] }), index("athan_friendships_user_idx").on(t.userId)]
);

export const athanRsvps = pgTable(
  "athan_rsvps",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => athanUsers.id, { onDelete: "cascade" }),
    prayer: text("prayer").notNull(),
    rsvpDate: text("rsvp_date").notNull(),
    status: text("status").notNull(),
    masjidId: text("masjid_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("athan_rsvps_unique_idx").on(t.userId, t.prayer, t.rsvpDate),
    index("athan_rsvps_user_date_idx").on(t.userId, t.rsvpDate),
  ]
);

export const athanMessages = pgTable(
  "athan_messages",
  {
    id: text("id").primaryKey(),
    senderId: text("sender_id")
      .notNull()
      .references(() => athanUsers.id, { onDelete: "cascade" }),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => athanUsers.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("athan_messages_conversation_idx").on(t.senderId, t.recipientId, t.createdAt)]
);

export type AthanUser = typeof athanUsers.$inferSelect;
export type AthanFriendship = typeof athanFriendships.$inferSelect;
export type AthanRsvp = typeof athanRsvps.$inferSelect;
export type AthanMessage = typeof athanMessages.$inferSelect;
