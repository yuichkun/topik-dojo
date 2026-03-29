CREATE TABLE `unit_progress` (
	`unit_id` text PRIMARY KEY NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action
);
