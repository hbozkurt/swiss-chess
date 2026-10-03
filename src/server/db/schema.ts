import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const tournaments = sqliteTable('tournaments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  totalRounds: integer('total_rounds').notNull(),
  status: text('status', { enum: ['setup', 'in_progress', 'completed'] })
    .notNull()
    .default('setup'),
  tiebreakOrder: text('tiebreak_order', { mode: 'json' })
    .notNull()
    .default(sql`'["buchholz_cut1","sonneborn_berger","direct_encounter","wins","black_games"]'`)
    .$type<string[]>(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const players = sqliteTable('players', {
  id: text('id').primaryKey(),
  tournamentId: text('tournament_id')
    .notNull()
    .references(() => tournaments.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  rating: integer('rating'),
  withdrawnAt: text('withdrawn_at'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const rounds = sqliteTable(
  'rounds',
  {
    id: text('id').primaryKey(),
    tournamentId: text('tournament_id')
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    roundNumber: integer('round_number').notNull(),
    status: text('status', { enum: ['pending', 'paired', 'completed', 'invalidated'] })
      .notNull()
      .default('pending'),
    pairedAt: text('paired_at'),
    completedAt: text('completed_at'),
    invalidatedAt: text('invalidated_at'),
  },
  (table) => [
    uniqueIndex('ux_rounds_live')
      .on(table.tournamentId, table.roundNumber)
      .where(sql`${table.invalidatedAt} is null`),
  ],
);

export const games = sqliteTable(
  'games',
  {
    id: text('id').primaryKey(),
    roundId: text('round_id')
      .notNull()
      .references(() => rounds.id, { onDelete: 'cascade' }),
    tournamentId: text('tournament_id')
      .notNull()
      .references(() => tournaments.id, { onDelete: 'cascade' }),
    boardNumber: integer('board_number').notNull(),
    whitePlayerId: text('white_player_id')
      .notNull()
      .references(() => players.id),
    blackPlayerId: text('black_player_id').references(() => players.id),
    result: real('result'),
    kind: text('kind', {
      enum: ['forfeit-loss', 'forfeit-win', 'full-bye', 'half-bye', 'pairing-bye', 'zero-bye'],
    }),
    enteredAt: text('entered_at'),
    editedAt: text('edited_at'),
  },
  (table) => [index('ix_games_round').on(table.roundId), index('ix_games_tournament').on(table.tournamentId)],
);

export const pairingInvalidations = sqliteTable('pairing_invalidations', {
  id: text('id').primaryKey(),
  tournamentId: text('tournament_id')
    .notNull()
    .references(() => tournaments.id, { onDelete: 'cascade' }),
  sourceRoundNumber: integer('source_round_number').notNull(),
  invalidatedRounds: text('invalidated_rounds', { mode: 'json' }).notNull().$type<number[]>(),
  invalidatedGames: integer('invalidated_games').notNull(),
  note: text('note'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const resultEditAudit = sqliteTable('result_edit_audit', {
  id: text('id').primaryKey(),
  gameId: text('game_id')
    .notNull()
    .references(() => games.id),
  oldResult: real('old_result'),
  newResult: real('new_result'),
  oldKind: text('old_kind'),
  newKind: text('new_kind'),
  editedAt: text('edited_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});
