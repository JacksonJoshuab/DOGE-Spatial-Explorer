# DOGE Municipal Platform — TODO

## Completed Features
- [x] Home landing page with West Liberty FY2024 data
- [x] Executive Dashboard with budget vs actual
- [x] Spatial Map with IoT sensor pins
- [x] 3D terrain / satellite tilt toggle on Spatial Map
- [x] Finance Hub with GL, AP Aging, Fund Balances, Debt Service tabs
- [x] CSV export on all Finance Hub tabs
- [x] Transparency Dashboard with embed code generator
- [x] Community Dev Hub with grant deadline calendar
- [x] Audit Studio
- [x] Admin RBAC panel (/admin/roles) with 8-role × 20-module permission matrix
- [x] AuthContext with role-based access control and RoleSwitcher
- [x] RouteGuard with RBAC enforcement and AccessDenied page
- [x] Live IoT polling via useIoTSensors hook (WebSocket + exponential backoff)
- [x] Persistent Postgres audit_log table via tRPC (audit.append/list/clear)
- [x] AuthContext persists audit entries to DB, fetches 200 rows on mount
- [x] MFA enforcement modal in RouteGuard for /secure, /le-hub, /admin/roles
- [x] Real TOTP secret storage — totpSecret/mfaEnabled columns, otplib, mfa.verifyCode tRPC
- [x] MFA modal calls server-side mfa.verifyCode for real validation
- [x] TOTP enrollment modal in AdminRoles staff table (QR code + mfa.verifyAndEnroll)
- [x] Push notifications for critical audit events via dispatchCriticalAlert
- [x] Audit log date-range picker + category/severity filter UI in Audit Studio
- [x] Filtered CSV export in Audit Studio (exports only visible filtered rows)
- [x] IoT sensor alert → audit pipeline (useIoTSensors fires appendAudit on alert transitions)
- [x] work_orders Postgres table + tRPC workOrders router (create/list/updateStatus/bySensor)
- [x] sensor_readings Postgres table + tRPC sensorReadings router (record/getLast24h/prune)
- [x] SensorDetail drill-down page at /map/sensor/:id with sparkline + audit history + work order form
- [x] Operations Center shows live DB work orders with status update controls
- [x] IoT alert dispatcher (alertDispatcher.ts) — Manus push + SendGrid + Twilio channels
- [x] Sensor telemetry seeding — useIoTSensors onTick writes to Postgres every 4s
- [x] Work order assignment dropdown in Operations Center (updateAssignee tRPC)
- [x] Microsoft Graph integration module (OAuth2 PKCE, Teams, Outlook, Calendar) at /ms-graph
- [x] MsGraphCallback page at /ms-graph/callback for PKCE token exchange
- [x] Microsoft 365 nav link in DashboardLayout Administration section

## In Progress
- [ ] Intelligence Feed Hub at /feeds — social media, news RSS, Federal Register, Census ACS, BLS economic data
- [ ] BLS quarterly trend chart (8-quarter AreaChart) in IntelFeedHub
- [ ] Sensor telemetry retention cron — prune sensor_readings older than 30 days
- [ ] Work order email notifications via dispatchCriticalAlert on create/reassign

## EMS & Fire Service Suite
- [x] EMS/Fire Postgres schema (ems_incidents, ems_units, ems_billing, ems_compliance)
- [x] tRPC EMS router (incident CRUD, unit status, billing workflow, compliance)
- [x] EMS Dispatch Board (/ems/dispatch) — live incident queue, unit assignment, status workflow
- [x] EMS Billing Dashboard (/ems/billing) — insurance claims, Medicare/Medicaid, revenue analytics
- [x] EMS Compliance Tracker (/ems/compliance) — HIPAA, NEMSIS, NFIRS, certifications, CMS audits
- [x] EMS Fleet Map (/ems/fleet) — live GPS positions of all units on Google Maps
