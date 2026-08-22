# DOGE Spatial Explorer — Enhancement TODO

## Phase 1: Full-Stack Backend (Persistent Database)
- [x] Add `items` table to drizzle/schema.ts with all Item fields
- [x] Run pnpm db:push to migrate schema
- [x] Add item CRUD query helpers to server/db.ts
- [x] Add items tRPC router (list, get, create, update, delete, stats)
- [x] Add users.switchRole tRPC procedure
- [x] Update client to use tRPC hooks instead of mockData
- [x] Update AuthContext to use trpc.auth.me instead of localStorage mock
- [x] Fix Login page to use Manus OAuth (getLoginUrl)

## Phase 2: Google Maps Integration (Geospatial Page)
- [x] Rewrite Geospatial.tsx with MapView component
- [x] Add 12 AIS vessel markers with AdvancedMarkerElement (color-coded by status)
- [x] Add 4 shipping lane polylines (East Coast, Gulf Coast, Pacific Coast, Mississippi River)
- [x] Add info window popups for vessel details on click
- [x] Add layer toggle controls (vessels, lanes, traffic)
- [x] Add vessel sidebar with click-to-pan functionality
- [x] Add tRPC ais.vessels endpoint with physics-based 30s position drift
- [x] Add 30-second auto-refresh with LIVE badge and manual refresh button

## Phase 3: Admin Role-Switcher + RBAC Demo
- [x] Add role-switcher UI to Settings page (member / admin toggle)
- [x] Update AppShell to show ADMIN badge in sidebar and topbar
- [x] Update AuthGate: enhanced 403 page with role info and link to Settings
- [x] Add Admin Panel page (admin-only protected route)
- [x] Add items:delete permission only to admin role
- [x] Write vitest tests for RBAC and CRUD procedures

## Phase 4: Persistent Audit Log
- [x] Add audit_log table to drizzle/schema.ts and run db:push
- [x] Add writeAuditLog and getAuditLog helpers to server/db.ts
- [x] Add activity.list tRPC procedure with pagination and action filter
- [x] Wire audit log writes to all CRUD operations (create, update, delete)
- [x] Rewrite Activity page with real tRPC data, filters, pagination, 30s auto-refresh
- [x] Fix Select.Item empty string value error in Activity page filter

## Phase 5: Email Notifications
- [x] Add notifyOwner call when record is promoted from draft → active
- [x] Add notifyOwner call when new record is created with active status

## Bug Fixes
- [x] Fix nested anchor tags in AppShell sidebar nav
- [x] Fix AuthContext render-phase navigation anti-pattern
- [x] Fix TypeScript 5.6.3 stale reference (upgraded to 5.9.3)
