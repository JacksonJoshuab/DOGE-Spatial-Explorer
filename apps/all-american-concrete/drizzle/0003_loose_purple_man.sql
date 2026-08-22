CREATE TABLE `aac_daily_kpi_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`snapshotDate` varchar(16) NOT NULL,
	`utilization` int NOT NULL,
	`materialExposure` int NOT NULL,
	`unresolvedExceptions` int NOT NULL,
	`fleetReadiness` int NOT NULL,
	`capturedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aac_daily_kpi_snapshots_id` PRIMARY KEY(`id`)
);
