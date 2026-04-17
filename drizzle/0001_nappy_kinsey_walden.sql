PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`order` integer DEFAULT 0,
	`createdAt` text DEFAULT '2026-04-17T15:25:34.455Z',
	`updatedAt` text DEFAULT '2026-04-17T15:25:34.455Z'
);
--> statement-breakpoint
INSERT INTO `__new_categories`("id", "key", "value", "order", "createdAt", "updatedAt") SELECT "id", "key", "value", "order", "createdAt", "updatedAt" FROM `categories`;--> statement-breakpoint
DROP TABLE `categories`;--> statement-breakpoint
ALTER TABLE `__new_categories` RENAME TO `categories`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `categories_key_unique` ON `categories` (`key`);--> statement-breakpoint
CREATE TABLE `__new_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer,
	`content` text NOT NULL,
	`author_id` text NOT NULL,
	`created_at` text,
	`updatedAt` text DEFAULT '2026-04-17T15:25:34.455Z',
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_comments`("id", "post_id", "content", "author_id", "created_at", "updatedAt") SELECT "id", "post_id", "content", "author_id", "created_at", "updatedAt" FROM `comments`;--> statement-breakpoint
DROP TABLE `comments`;--> statement-breakpoint
ALTER TABLE `__new_comments` RENAME TO `comments`;--> statement-breakpoint
CREATE TABLE `__new_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`author_id` text NOT NULL,
	`tag` text NOT NULL,
	`created_at` text,
	`updatedAt` text DEFAULT '2026-04-17T15:25:34.453Z'
);
--> statement-breakpoint
INSERT INTO `__new_posts`("id", "title", "content", "author_id", "tag", "created_at", "updatedAt") SELECT "id", "title", "content", "author_id", "tag", "created_at", "updatedAt" FROM `posts`;--> statement-breakpoint
DROP TABLE `posts`;--> statement-breakpoint
ALTER TABLE `__new_posts` RENAME TO `posts`;