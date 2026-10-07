import { relations, sql } from "drizzle-orm";
import { pgTable, pgEnum, uuid, text, integer, timestamp, jsonb, index, uniqueIndex, check, date } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

export const sectionEnum = pgEnum("section", ["sciences", "genie", "gestion", "droit"]);
export const listingKindEnum = pgEnum("listing_kind", ["sale", "loan"]);
export const listingStatusEnum = pgEnum("listing_status", ["available", "reserved", "lent", "closed", "removed"]);
export const reservationStatusEnum = pgEnum("reservation_status", ["requested", "accepted", "declined", "cancelled", "handed", "returned", "completed"]);
export const emailStatusEnum = pgEnum("email_status", ["stored", "sent", "failed"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
};

export const listing = pgTable(
  "listing",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sellerId: uuid("seller_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    section: sectionEnum("section").notNull(),
    courseCode: text("course_code").notNull(),
    title: text("title").notNull(),
    edition: text("edition").notNull(),
    school: text("school").notNull(),
    condition: text("condition").notNull(),
    kind: listingKindEnum("kind").notNull(),
    priceCents: integer("price_cents"),
    meetingPlace: text("meeting_place").notNull(),
    spineColor: text("spine_color").notNull(),
    status: listingStatusEnum("status").notNull().default("available"),
    ...timestamps,
  },
  (t) => [
    index("listing_seller_idx").on(t.sellerId),
    index("listing_status_section_idx").on(t.status, t.section),
    index("listing_course_idx").on(t.courseCode),
    check("listing_price_kind_chk", sql`(${t.kind} = 'loan' and ${t.priceCents} is null) or (${t.kind} = 'sale' and ${t.priceCents} between 0 and 100000)`),
    check("listing_lengths_chk", sql`char_length(${t.title}) between 2 and 120 and char_length(${t.courseCode}) between 3 and 12 and char_length(${t.meetingPlace}) between 2 and 120`),
    check("listing_color_chk", sql`${t.spineColor} ~ '^#[0-9a-fA-F]{6}$'`),
  ],
);

export const reservation = pgTable(
  "reservation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id").notNull().references(() => listing.id, { onDelete: "cascade" }),
    buyerId: uuid("buyer_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    status: reservationStatusEnum("status").notNull().default("requested"),
    message: text("message"),
    dueDate: date("due_date"),
    remindedAt: timestamp("reminded_at", { withTimezone: true }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("reservation_listing_idx").on(t.listingId),
    index("reservation_buyer_idx").on(t.buyerId),
    // One active reservation per listing: the database refuses a second one, even on a double click.
    uniqueIndex("reservation_one_active_uq").on(t.listingId).where(sql`${t.status} in ('requested','accepted','handed')`),
    check("reservation_message_chk", sql`${t.message} is null or char_length(${t.message}) <= 500`),
  ],
);

export const emailOutbox = pgTable(
  "email_outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    to: text("to").notNull(),
    subject: text("subject").notNull(),
    text: text("text").notNull(),
    kind: text("kind").notNull(),
    userId: uuid("user_id").references(() => user.id, { onDelete: "set null" }),
    status: emailStatusEnum("status").notNull().default("stored"),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("email_outbox_to_idx").on(t.to), index("email_outbox_created_idx").on(t.createdAt)],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    details: jsonb("details"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

export const listingRelations = relations(listing, ({ one, many }) => ({
  seller: one(user, { fields: [listing.sellerId], references: [user.id] }),
  reservations: many(reservation),
}));
export const reservationRelations = relations(reservation, ({ one }) => ({
  listing: one(listing, { fields: [reservation.listingId], references: [listing.id] }),
  buyer: one(user, { fields: [reservation.buyerId], references: [user.id] }),
}));
