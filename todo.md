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
- [x] MFA enforcement modal in RouteGuard for /secure, /le-hub, /admin/roles (demo bypass)
- [x] Push notifications for critical audit events via notifyOwner

## In Progress
- [ ] Real TOTP secret storage — totpSecret column in users table, otplib, auth.verifyMfa tRPC procedure
- [ ] Wire MFA modal to call server-side verifyMfa instead of demo bypass
- [ ] Audit log date-range picker + category/severity filter UI in Audit Studio
- [ ] IoT sensor alert → audit pipeline (useIoTSensors calls appendAudit on alert transitions)
