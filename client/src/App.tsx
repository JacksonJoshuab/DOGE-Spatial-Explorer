// DOGE Spatial Explorer — App Router
// Design: Spatial Intelligence Command Center
// Flat routing pattern — all routes defined at top level to avoid Wouter nested Switch issues

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import AuthGate from "./components/AuthGate";
import AppShell from "./components/AppShell";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ItemsList from "./pages/ItemsList";
import ItemNew from "./pages/ItemNew";
import ItemDetail from "./pages/ItemDetail";
import ItemEdit from "./pages/ItemEdit";
import Geospatial from "./pages/Geospatial";
import Activity from "./pages/Activity";
import Settings from "./pages/Settings";

// Wrap a page in AuthGate + AppShell
function Protected({ children, permissions }: { children: React.ReactNode; permissions?: string[] }) {
  return (
    <AuthGate requiredPermissions={permissions}>
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/login" component={Login} />
      <Route path="/">
        <Redirect to="/app" />
      </Route>

      {/* Protected — order matters: more specific routes first */}
      <Route path="/app/items/new">
        <Protected><ItemNew /></Protected>
      </Route>
      <Route path="/app/items/:id/edit">
        {(params) => (
          <Protected><ItemEdit /></Protected>
        )}
      </Route>
      <Route path="/app/items/:id">
        {(params) => (
          <Protected><ItemDetail /></Protected>
        )}
      </Route>
      <Route path="/app/items">
        <Protected permissions={["items:read"]}><ItemsList /></Protected>
      </Route>
      <Route path="/app/geospatial">
        <Protected><Geospatial /></Protected>
      </Route>
      <Route path="/app/activity">
        <Protected><Activity /></Protected>
      </Route>
      <Route path="/app/settings">
        <Protected><Settings /></Protected>
      </Route>
      <Route path="/app">
        <Protected><Dashboard /></Protected>
      </Route>

      {/* 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AuthProvider>
          <TooltipProvider>
            <Toaster richColors position="top-right" />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
