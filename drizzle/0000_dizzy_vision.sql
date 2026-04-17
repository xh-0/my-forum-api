CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`order` integer DEFAULT 0,
	`createdAt` text DEFAULT '2026-04-17T15:23:07.151Z',
	`updatedAt` text DEFAULT '2026-04-17T15:23:07.151Z'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_key_unique` ON `categories` (`key`);--> statement-breakpoint
CREATE TABLE `comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`post_id` integer,
	`content` text NOT NULL,
	`author_id` text NOT NULL,
	`created_at` text,
	`updatedAt` text DEFAULT '2026-04-17T15:23:07.151Z',
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`author_id` text NOT NULL,
	`tag` text NOT NULL,
	`created_at` text,
	`updatedAt` text DEFAULT '2026-04-17T15:23:07.149Z'
);
