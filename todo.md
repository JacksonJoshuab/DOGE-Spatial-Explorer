# DOGE Spatial Explorer — Enhancement TODO

## Phase 1: Full-Stack Backend (Persistent Database)
- [x] Add `items` table to drizzle/schema.ts with all Item fields
- [x] Run pnpm db:push to migrate schema
- [x] Add item CRUD query helpers to server/db.ts (getItems, getItemBySlug, createItem, updateItem, deleteItem, seedItemsIfEmpty, switchUserRole)
- [x] Add items tRPC router (list, get, create, update, delete, stats)
- [x] Add users.switchRole tRPC procedure
- [x] Update client to use tRPC hooks instead of mockData
- [x] Update AuthContext to use trpc.auth.me instead of localStorage mock
- [x] Resolve Home.tsx conflict (keep redirect to /app)
- [x] Fix Login page to use Manus OAuth (getLoginUrl)

## Phase 2: Google Maps Integration (Geospatial Page)
- [x] Read existing Map.tsx component
- [x] Rewrite Geospatial.tsx with MapView component
- [x] Add 8 AIS vessel markers with AdvancedMarkerElement (color-coded by status)
- [x] Add 4 shipping lane polylines (East Coast, Gulf Coast, Pacific Coast, Mississippi River)
- [x] Add info window popups for vessel details on click
- [x] Add layer toggle controls (vessels, lanes, traffic)
- [x] Add vessel sidebar with click-to-pan functionality
- [x] Add shipping lanes legend
- [x] Add stats row (vessels tracked, underway, lanes, data points)

## Phase 3: Admin Role-Switcher + RBAC Demo
- [x] Add role-switcher UI to Settings page (member / admin toggle)
- [x] Update AppShell to show ADMIN badge in sidebar and topbar
- [x] Update AuthGate: enhanced 403 page with role info and link to Settings
- [x] Add items:delete permission only to admin role (delete button hidden for members)
- [x] Demo: member cannot delete records, admin can
- [x] Write vitest tests: auth.me, auth.logout, RBAC delete guard, RBAC switchRole guard
