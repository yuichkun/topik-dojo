CREATE TABLE `learning_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`grade` integer NOT NULL,
	`listening_mastered_count` integer NOT NULL,
	`reading_mastered_count` integer NOT NULL,
	`total_words_count` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `learning_progress_date_grade_unique` ON `learning_progress` (`date`,`grade`);--> statement-breakpoint
CREATE TABLE `srs_management` (
	`id` text PRIMARY KEY NOT NULL,
	`word_id` text NOT NULL,
	`mastery_level` integer NOT NULL,
	`ease_factor` real NOT NULL,
	`next_review_date` integer,
	`interval_days` integer NOT NULL,
	`mistake_count` integer NOT NULL,
	`last_reviewed` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`word_id`) REFERENCES `words`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `units` (
	`id` text PRIMARY KEY NOT NULL,
	`grade` integer NOT NULL,
	`unit_number` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `word_mastery` (
	`id` text PRIMARY KEY NOT NULL,
	`word_id` text NOT NULL,
	`test_type` text NOT NULL,
	`mastered_date` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`word_id`) REFERENCES `words`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `word_mastery_word_id_test_type_unique` ON `word_mastery` (`word_id`,`test_type`);--> statement-breakpoint
CREATE TABLE `words` (
	`id` text PRIMARY KEY NOT NULL,
	`korean` text NOT NULL,
	`japanese` text NOT NULL,
	`example_korean` text,
	`example_japanese` text,
	`grade` integer NOT NULL,
	`unit_id` text NOT NULL,
	`unit_order` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action
);
