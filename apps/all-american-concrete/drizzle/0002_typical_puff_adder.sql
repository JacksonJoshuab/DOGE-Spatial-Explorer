CREATE TABLE `aac_alert_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`note` text,
	`actor` varchar(120),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aac_alert_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aac_daily_brief_actions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(220) NOT NULL,
	`owner` varchar(120),
	`priority` enum('critical','high','normal','low') NOT NULL DEFAULT 'normal',
	`status` enum('open','in_progress','complete') NOT NULL DEFAULT 'open',
	`dueLabel` varchar(64),
	`source` varchar(120) NOT NULL DEFAULT 'Daily Brief',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aac_daily_brief_actions_id` PRIMARY KEY(`id`)
);
