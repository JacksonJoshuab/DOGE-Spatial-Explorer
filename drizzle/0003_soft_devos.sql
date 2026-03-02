CREATE TABLE `sensor_readings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sensorId` varchar(32) NOT NULL,
	`sensorName` varchar(128) NOT NULL,
	`sensorType` varchar(32) NOT NULL,
	`value` varchar(32) NOT NULL,
	`reading` text NOT NULL,
	`status` enum('online','warning','alert','offline') NOT NULL DEFAULT 'online',
	`ts` bigint NOT NULL,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sensor_readings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `work_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`woNumber` varchar(16) NOT NULL,
	`title` varchar(256) NOT NULL,
	`priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal',
	`status` enum('open','in_progress','resolved','cancelled') NOT NULL DEFAULT 'open',
	`sensorId` varchar(32),
	`sensorName` varchar(128),
	`assignee` varchar(128) NOT NULL,
	`description` text,
	`estimatedHours` varchar(8),
	`createdBy` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	CONSTRAINT `work_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `work_orders_woNumber_unique` UNIQUE(`woNumber`)
);
