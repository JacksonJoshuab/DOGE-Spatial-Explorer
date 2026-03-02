CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` varchar(32) NOT NULL,
	`ts` bigint NOT NULL,
	`isoTime` varchar(32) NOT NULL,
	`actor` varchar(128) NOT NULL,
	`actorRole` varchar(64) NOT NULL,
	`category` varchar(32) NOT NULL,
	`action` varchar(64) NOT NULL,
	`notNull` text NOT NULL,
	`severity` enum('info','warning','critical') NOT NULL DEFAULT 'info',
	`detail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
