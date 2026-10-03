CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`round_id` text NOT NULL,
	`tournament_id` text NOT NULL,
	`board_number` integer NOT NULL,
	`white_player_id` text NOT NULL,
	`black_player_id` text,
	`result` real,
	`kind` text,
	`entered_at` text,
	`edited_at` text,
	FOREIGN KEY (`round_id`) REFERENCES `rounds`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`white_player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`black_player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `ix_games_round` ON `games` (`round_id`);--> statement-breakpoint
CREATE INDEX `ix_games_tournament` ON `games` (`tournament_id`);--> statement-breakpoint
CREATE TABLE `pairing_invalidations` (
	`id` text PRIMARY KEY NOT NULL,
	`tournament_id` text NOT NULL,
	`source_round_number` integer NOT NULL,
	`invalidated_rounds` text NOT NULL,
	`invalidated_games` integer NOT NULL,
	`note` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` text PRIMARY KEY NOT NULL,
	`tournament_id` text NOT NULL,
	`name` text NOT NULL,
	`rating` integer,
	`withdrawn_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `result_edit_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`old_result` real,
	`new_result` real,
	`old_kind` text,
	`new_kind` text,
	`edited_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rounds` (
	`id` text PRIMARY KEY NOT NULL,
	`tournament_id` text NOT NULL,
	`round_number` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`paired_at` text,
	`completed_at` text,
	`invalidated_at` text,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ux_rounds_live` ON `rounds` (`tournament_id`,`round_number`) WHERE "rounds"."invalidated_at" is null;--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`total_rounds` integer NOT NULL,
	`status` text DEFAULT 'setup' NOT NULL,
	`tiebreak_order` text DEFAULT '["buchholz_cut1","sonneborn_berger","direct_encounter","wins","black_games"]' NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
