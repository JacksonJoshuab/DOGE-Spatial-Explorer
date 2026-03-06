import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "./components/Layout";

const Home = lazy(() => import("./pages/Home"));
const SpatialStudio = lazy(() => import("./pages/SpatialStudio"));
const Collaboration = lazy(() => import("./pages/Collaboration"));
const DeviceManager = lazy(() => import("./pages/DeviceManager"));
const AIStudio = lazy(() => import("./pages/AIStudio"));
const AssetLibrary = lazy(() => import("./pages/AssetLibrary"));
const PrivacyDashboard = lazy(() => import("./pages/PrivacyDashboard"));
// Blender integration features
const BlenderBridge = lazy(() => import("./pages/BlenderBridge"));
const NodeGraph = lazy(() => import("./pages/NodeGraph"));
const RenderFarm = lazy(() => import("./pages/RenderFarm"));
const MaterialSync = lazy(() => import("./pages/MaterialSync"));
const SceneVersionControl = lazy(() => import("./pages/SceneVersionControl"));
// Advanced features
const Analytics = lazy(() => import("./pages/Analytics"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const AudioStudio = lazy(() => import("./pages/AudioStudio"));
const Timeline = lazy(() => import("./pages/Timeline"));
const Settings = lazy(() => import("./pages/Settings"));

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs text-gray-500">Loading spatial environment…</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/studio" element={<SpatialStudio />} />
          <Route path="/collaboration" element={<Collaboration />} />
          <Route path="/devices" element={<DeviceManager />} />
          <Route path="/ai" element={<AIStudio />} />
          <Route path="/assets" element={<AssetLibrary />} />
          <Route path="/privacy" element={<PrivacyDashboard />} />
          {/* Blender integration */}
          <Route path="/blender-bridge" element={<BlenderBridge />} />
          <Route path="/node-graph" element={<NodeGraph />} />
          <Route path="/render-farm" element={<RenderFarm />} />
          <Route path="/materials" element={<MaterialSync />} />
          <Route path="/version-control" element={<SceneVersionControl />} />
          {/* Advanced features */}
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/audio" element={<AudioStudio />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
