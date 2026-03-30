CREATE TABLE `app_metadata` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_unit_progress` (
	`unit_id` text PRIMARY KEY NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`unit_id`) REFERENCES `units`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_unit_progress`("unit_id", "completed") SELECT "unit_id", "completed" FROM `unit_progress`;--> statement-breakpoint
DROP TABLE `unit_progress`;--> statement-breakpoint
ALTER TABLE `__new_unit_progress` RENAME TO `unit_progress`;--> statement-breakpoint
PRAGMA foreign_keys=ON;