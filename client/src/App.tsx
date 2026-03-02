import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CommandPalette, CommandPaletteProvider } from "./components/CommandPalette";
import { NotificationProvider, NotificationPanel } from "./components/NotificationPanel";

// Public pages
import Home from "./pages/Home";
import Platform from "./pages/Platform";
import Solutions from "./pages/Solutions";
import Roadmap from "./pages/Roadmap";
import Contact from "./pages/Contact";
import ROICalculator from "./pages/ROICalculator";

// Marketplace & IP
import HardwareMarketplace from "./pages/HardwareMarketplace";
import IPPipeline from "./pages/IPPipeline";
import CapitalHub from "./pages/CapitalHub";
import DataCenter from "./pages/DataCenter";

// Dashboard / operational
import Dashboard from "./pages/Dashboard";
import AuditStudio from "./pages/AuditStudio";
import OperationsCenter from "./pages/OperationsCenter";
import SpatialMap from "./pages/SpatialMap";

// Compliance / secure
import RecordsManagement from "./pages/RecordsManagement";
import SecureModules from "./pages/SecureModules";

// Resident portal
import ResidentPortal from "./pages/ResidentPortal";

// Expanded department hubs
import LEHub from "./pages/LEHub";
import UtilitiesHub from "./pages/UtilitiesHub";
import ParksHub from "./pages/ParksHub";
import CommunityDevHub from "./pages/CommunityDevHub";
import CouncilReport from "./pages/CouncilReport";
import StaffDirectory from "./pages/StaffDirectory";

function AppShell() {
  return (
    <>
      <Router />
      <CommandPalette />
      <NotificationPanel />
    </>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public marketing */}
      <Route path="/" component={Home} />
      <Route path="/platform" component={Platform} />
      <Route path="/solutions" component={Solutions} />
      <Route path="/roadmap" component={Roadmap} />
      <Route path="/contact" component={Contact} />
      <Route path="/roi" component={ROICalculator} />

      {/* Marketplace & IP */}
      <Route path="/hardware" component={HardwareMarketplace} />
      <Route path="/ip-pipeline" component={IPPipeline} />
      <Route path="/capital-hub" component={CapitalHub} />
      <Route path="/data-center" component={DataCenter} />

      {/* Operational dashboard */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/audit" component={AuditStudio} />
      <Route path="/operations" component={OperationsCenter} />
      <Route path="/map" component={SpatialMap} />

      {/* Compliance & secure */}
      <Route path="/records" component={RecordsManagement} />
      <Route path="/secure" component={SecureModules} />

      {/* Resident portal */}
      <Route path="/resident" component={ResidentPortal} />

      {/* Department hubs */}
      <Route path="/le-hub" component={LEHub} />
      <Route path="/utilities" component={UtilitiesHub} />
      <Route path="/parks" component={ParksHub} />
      <Route path="/community-dev" component={CommunityDevHub} />
      <Route path="/council-report" component={CouncilReport} />
      <Route path="/staff" component={StaffDirectory} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <CommandPaletteProvider>
          <NotificationProvider>
            <TooltipProvider>
              <Toaster />
              <AppShell />
            </TooltipProvider>
          </NotificationProvider>
        </CommandPaletteProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
