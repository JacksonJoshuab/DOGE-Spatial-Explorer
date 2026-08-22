CREATE TABLE `audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`action` enum('create','update','delete') NOT NULL,
	`resourceType` varchar(64) NOT NULL,
	`resourceId` varchar(64) NOT NULL,
	`resourceName` varchar(200),
	`actorId` varchar(64) NOT NULL,
	`actorName` varchar(200),
	`changes` text,
	`context` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
