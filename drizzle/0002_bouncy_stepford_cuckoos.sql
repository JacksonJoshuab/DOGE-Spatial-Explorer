ALTER TABLE `users` ADD `totpSecret` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `mfaEnabled` int DEFAULT 0 NOT NULL;