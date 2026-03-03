import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CommandPalette, CommandPaletteProvider } from "./components/CommandPalette";
import { NotificationProvider, NotificationPanel } from "./components/NotificationPanel";
import { AuthProvider } from "./contexts/AuthContext";
import RouteGuard from "./components/RouteGuard";
import AccessDenied from "./pages/AccessDenied";

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
import FinanceHub from "./pages/FinanceHub";
import ResidentMobile from "./pages/ResidentMobile";
import UtilityBillQR from "./pages/UtilityBillQR";
import Transparency from "./pages/Transparency";
import AdminRoles from "./pages/AdminRoles";
import SensorDetail from "./pages/SensorDetail";
import MsGraphExplorer from "./pages/MsGraphExplorer";
import MsGraphCallback from "./pages/MsGraphCallback";
import IntelFeedHub from "./pages/IntelFeedHub";
import EmsDispatch from "./pages/EmsDispatch";
import EmsFleet from "./pages/EmsFleet";
import EmsBilling from "./pages/EmsBilling";
import EmsCompliance from "./pages/EmsCompliance";
import SpatialStudio from "./pages/SpatialStudio";
import SpatialCollaboration from "./pages/SpatialCollaboration";
import DeviceManager from "./pages/DeviceManager";
import AIGenerationStudio from "./pages/AIGenerationStudio";
import PrivacyDashboard from "./pages/PrivacyDashboard";
import AssetLibrary from "./pages/AssetLibrary";

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
  // make sure to consider if you need authentication for certain routes
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
      <Route path="/dashboard">{() => <RouteGuard path="/dashboard"><Dashboard /></RouteGuard>}</Route>
      <Route path="/audit">{() => <RouteGuard path="/audit"><AuditStudio /></RouteGuard>}</Route>
      <Route path="/operations">{() => <RouteGuard path="/operations"><OperationsCenter /></RouteGuard>}</Route>
      <Route path="/map">{() => <RouteGuard path="/map"><SpatialMap /></RouteGuard>}</Route>
      <Route path="/map/sensor/:id">{(params) => <RouteGuard path="/map"><SensorDetail /></RouteGuard>}</Route>

      {/* Compliance & secure */}
      <Route path="/records">{() => <RouteGuard path="/records"><RecordsManagement /></RouteGuard>}</Route>
      <Route path="/secure">{() => <RouteGuard path="/secure"><SecureModules /></RouteGuard>}</Route>

      {/* Resident portal */}
      <Route path="/resident" component={ResidentPortal} />

      {/* Department hubs */}
      <Route path="/le-hub">{() => <RouteGuard path="/le-hub"><LEHub /></RouteGuard>}</Route>
      <Route path="/utilities">{() => <RouteGuard path="/utilities"><UtilitiesHub /></RouteGuard>}</Route>
      <Route path="/parks">{() => <RouteGuard path="/parks"><ParksHub /></RouteGuard>}</Route>
      <Route path="/community-dev">{() => <RouteGuard path="/community-dev"><CommunityDevHub /></RouteGuard>}</Route>
      <Route path="/council-report">{() => <RouteGuard path="/council-report"><CouncilReport /></RouteGuard>}</Route>
      <Route path="/staff">{() => <RouteGuard path="/staff"><StaffDirectory /></RouteGuard>}</Route>
      <Route path="/finance">{() => <RouteGuard path="/finance"><FinanceHub /></RouteGuard>}</Route>
      <Route path="/resident/m" component={ResidentMobile} />
      <Route path="/utility-bill-qr" component={UtilityBillQR} />
      <Route path="/transparency">{() => <RouteGuard path="/transparency"><Transparency /></RouteGuard>}</Route>

      {/* Admin */}
      <Route path="/admin/roles">{() => <RouteGuard path="/admin/roles"><AdminRoles /></RouteGuard>}</Route>

      {/* Intelligence Feed Hub */}
      <Route path="/feeds">{() => <RouteGuard path="/feeds"><IntelFeedHub /></RouteGuard>}</Route>

      {/* EMS / Fire Service Suite */}
      <Route path="/ems/dispatch">{() => <RouteGuard path="/ems/dispatch"><EmsDispatch /></RouteGuard>}</Route>
      <Route path="/ems/fleet">{() => <RouteGuard path="/ems/fleet"><EmsFleet /></RouteGuard>}</Route>
      <Route path="/ems/billing">{() => <RouteGuard path="/ems/billing"><EmsBilling /></RouteGuard>}</Route>
      <Route path="/ems/compliance">{() => <RouteGuard path="/ems/compliance"><EmsCompliance /></RouteGuard>}</Route>

      {/* Spatial Studio */}
      <Route path="/spatial-studio">{() => <RouteGuard path="/spatial-studio"><SpatialStudio /></RouteGuard>}</Route>
      <Route path="/spatial-collab">{() => <RouteGuard path="/spatial-collab"><SpatialCollaboration /></RouteGuard>}</Route>
      <Route path="/devices">{() => <RouteGuard path="/devices"><DeviceManager /></RouteGuard>}</Route>
      <Route path="/ai-studio">{() => <RouteGuard path="/ai-studio"><AIGenerationStudio /></RouteGuard>}</Route>
      <Route path="/privacy">{() => <RouteGuard path="/privacy"><PrivacyDashboard /></RouteGuard>}</Route>
      <Route path="/assets">{() => <RouteGuard path="/assets"><AssetLibrary /></RouteGuard>}</Route>

      {/* Microsoft Graph integration */}
      <Route path="/ms-graph">{() => <RouteGuard path="/ms-graph"><MsGraphExplorer /></RouteGuard>}</Route>
      <Route path="/ms-graph/callback" component={MsGraphCallback} />

      {/* Access denied */}
      <Route path="/access-denied" component={AccessDenied} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <AuthProvider>
          <CommandPaletteProvider>
            <NotificationProvider>
              <TooltipProvider>
                <Toaster />
                <AppShell />
              </TooltipProvider>
            </NotificationProvider>
          </CommandPaletteProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
