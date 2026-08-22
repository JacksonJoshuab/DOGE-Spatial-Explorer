CREATE TABLE `aac_crew_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`role` varchar(96) NOT NULL,
	`availability` enum('assigned','available','off','unavailable') NOT NULL DEFAULT 'available',
	`assignment` varchar(160),
	`shift` varchar(64),
	`phone` varchar(32),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aac_crew_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aac_daily_briefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`briefDate` varchar(16) NOT NULL,
	`title` varchar(160) NOT NULL,
	`content` text NOT NULL,
	`notificationDelivered` int NOT NULL DEFAULT 0,
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aac_daily_briefs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `aac_fleet_equipment` (
	`id` int AUTO_INCREMENT NOT NULL,
	`unitNumber` varchar(32) NOT NULL,
	`type` varchar(96) NOT NULL,
	`status` enum('operational','maintenance','alert','offline') NOT NULL DEFAULT 'operational',
	`fuelPercent` int NOT NULL DEFAULT 100,
	`mileage` int NOT NULL DEFAULT 0,
	`assignment` varchar(160),
	`operator` varchar(120),
	`lastService` varchar(32),
	`serviceDue` varchar(32),
	`maintenanceNote` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aac_fleet_equipment_id` PRIMARY KEY(`id`),
	CONSTRAINT `aac_fleet_equipment_unitNumber_unique` UNIQUE(`unitNumber`)
);
--> statement-breakpoint
CREATE TABLE `aac_job_sites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(160) NOT NULL,
	`client` varchar(160),
	`location` varchar(255) NOT NULL,
	`status` enum('active','scheduled','standby','complete','on_hold') NOT NULL DEFAULT 'scheduled',
	`pourDate` varchar(32),
	`pourStart` varchar(32),
	`pourEnd` varchar(32),
	`plannedYards` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aac_job_sites_id` PRIMARY KEY(`id`),
	CONSTRAINT `aac_job_sites_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `aac_materials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(64) NOT NULL,
	`name` varchar(160) NOT NULL,
	`unit` varchar(24) NOT NULL,
	`quantity` decimal(12,2) NOT NULL DEFAULT '0.00',
	`reorderThreshold` decimal(12,2) NOT NULL DEFAULT '0.00',
	`supplier` varchar(160),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aac_materials_id` PRIMARY KEY(`id`),
	CONSTRAINT `aac_materials_sku_unique` UNIQUE(`sku`)
);
--> statement-breakpoint
CREATE TABLE `aac_operational_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(200) NOT NULL,
	`severity` enum('critical','warning','info') NOT NULL DEFAULT 'info',
	`source` varchar(120) NOT NULL,
	`detail` text NOT NULL,
	`status` enum('active','acknowledged','resolved') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aac_operational_alerts_id` PRIMARY KEY(`id`)
);
