import {
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/** プロフィール */
export const profiles = pgTable('profiles', {
  /** auth.users(id) への外部キー（Supabase SQL で定義） */
  id: uuid('id').primaryKey(),
  /** ユーザーが決めるID（不変・ユニーク） */
  username: varchar('username', { length: 255 }).unique().notNull(),
  /** 表示名（変更可能） */
  displayName: varchar('display_name', { length: 255 }),
  /** アバターURL（将来用） */
  avatarUrl: varchar('avatar_url', { length: 1024 }),
  /** BAN日時 */
  bannedAt: timestamp('banned_at', { withTimezone: true }),
  /** ソフトデリート日時 */
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  /** 作成日時 */
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  /** 更新日時 */
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
