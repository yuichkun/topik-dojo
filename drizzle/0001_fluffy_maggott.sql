CREATE TABLE `unit_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`unit_id` text NOT NULL,
	`last_word_index` integer NOT NULL,
	`completed_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action
);
