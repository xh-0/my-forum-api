ALTER TABLE `users` ADD `nickname` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatar_url` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `email` text;--> statement-breakpoint
ALTER TABLE `users` ADD `is_admin` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `status` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `last_login` text;--> statement-breakpoint
ALTER TABLE `users` ADD `post_count` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `comment_count` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `reputation` integer DEFAULT 0;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);