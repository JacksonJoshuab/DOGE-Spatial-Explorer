/**
 * SpatialViewport — Interactive 3D viewport using React Three Fiber
 * Renders the spatial scene with real-time collaboration cursors,
 * privacy zones, and plasma simulation visualization.
 */
import { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  GizmoHelper,
  GizmoViewport,
  Environment,
  Stars,
  Float,
  Sphere,
  Box,
  Cylinder,
  Cone,
  Torus,
  Text,
  Html,
  PerspectiveCamera,
  ContactShadows,
  BakeShadows,
  Edges,
  Outlines,
} from "@react-three/drei";
import * as THREE from "three";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SceneNode {
  id: string;
  name: string;
  type: "mesh" | "light" | "camera" | "group" | "audio" | "particle" | "text3D" | "volumetric" | "privacyZone";
  visible: boolean;
  locked: boolean;
  selected?: boolean;
  children: SceneNode[];
  transform: { x: number; y: number; z: number; rx: number; ry: number; rz: number; sx: number; sy: number; sz: number };
  color?: string;
  geometry?: "box" | "sphere" | "cylinder" | "cone" | "torus" | "plane";
}

interface Collaborator {
  id: string;
  name: string;
  platform: "visionOS" | "metaQuest" | "blender" | "web" | "iPadOS" | "tvOS";
  color: string;
  status: "active" | "idle" | "away";
  selectedNodeId?: string;
  cursorPosition?: { x: number; y: number; z: number };
}

interface ViewportProps {
  nodes: SceneNode[];
  collaborators: Collaborator[];
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  showGrid: boolean;
  showGizmo: boolean;
  showCollaborators: boolean;
  showPrivacyZones: boolean;
  viewMode: "perspective" | "top" | "front" | "right";
  renderMode: "solid" | "wireframe" | "material" | "xray";
}

// ─── Plasma Column Visualization ─────────────────────────────────────────────

function PlasmaColumn() {
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const time = useRef(0);

  // Generate particle positions for plasma column
  const particleCount = 800;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const t = i / particleCount;
    const angle = t * Math.PI * 20 + Math.random() * 0.5;
    const radius = 0.15 + Math.random() * 0.25 * Math.sin(t * Math.PI * 8);
    const height = (t - 0.5) * 5;

    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = height;
    positions[i * 3 + 2] = Math.sin(angle) * radius;

    // Blue-purple gradient
    const intensity = 0.5 + 0.5 * Math.sin(t * Math.PI * 6);
    colors[i * 3] = 0.2 + intensity * 0.4;     // R
    colors[i * 3 + 1] = 0.3 + intensity * 0.3; // G
    colors[i * 3 + 2] = 0.8 + intensity * 0.2; // B
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  useFrame((state) => {
    time.current += 0.016;
    if (groupRef.current) {
      groupRef.current.rotation.y = time.current * 0.3;
    }
    if (particlesRef.current) {
      const posAttr = particlesRef.current.geometry.attributes.position;
      for (let i = 0; i < particleCount; i++) {
        const t = i / particleCount;
        const angle = t * Math.PI * 20 + time.current * 2 + Math.random() * 0.05;
        const radius = 0.15 + 0.25 * Math.abs(Math.sin(t * Math.PI * 8 + time.current));
        posAttr.setX(i, Math.cos(angle) * radius);
        posAttr.setZ(i, Math.sin(angle) * radius);
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Core plasma column */}
      <points ref={particlesRef} geometry={geometry}>
        <pointsMaterial
          size={0.04}
          vertexColors
          transparent
          opacity={0.85}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Pinch nodes — the characteristic Z-pinch compression rings */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[0, -2.5 + i * 0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.18 - i * 0.01, 0.025, 8, 24]} />
          <meshBasicMaterial color={i === 3 ? "#8B5CF6" : "#4A90D9"} transparent opacity={0.7} />
        </mesh>
      ))}

      {/* Central energy core */}
      <mesh position={[0, -2.5, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color="#FF6B6B" />
      </mesh>

      {/* Bounding box wireframe */}
      <mesh>
        <boxGeometry args={[1, 5, 1]} />
        <meshBasicMaterial color="#FF69B4" wireframe transparent opacity={0.3} />
      </mesh>

      {/* Axis arrows */}
      <arrowHelper args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, -2.5, 0), 0.5, 0xff0000]} />
      <arrowHelper args={[new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -2.5, 0), 0.5, 0x00ff00]} />
      <arrowHelper args={[new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, -2.5, 0), 0.5, 0x0000ff]} />
    </group>
  );
}

// ─── Scene Node Renderer ──────────────────────────────────────────────────────

function SceneNodeMesh({
  node,
  selected,
  onSelect,
  renderMode,
}: {
  node: SceneNode;
  selected: boolean;
  onSelect: (id: string) => void;
  renderMode: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current && selected) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  if (!node.visible) return null;

  const color = node.color || "#4A90D9";
  const wireframe = renderMode === "wireframe";
  const xray = renderMode === "xray";

  const geomProps = {
    box: <boxGeometry args={[1, 1, 1]} />,
    sphere: <sphereGeometry args={[0.6, 32, 32]} />,
    cylinder: <cylinderGeometry args={[0.5, 0.5, 1, 32]} />,
    cone: <coneGeometry args={[0.5, 1, 32]} />,
    torus: <torusGeometry args={[0.5, 0.2, 16, 64]} />,
    plane: <planeGeometry args={[1, 1]} />,
  };

  const geom = geomProps[node.geometry || "box"] || geomProps.box;

  return (
    <mesh
      ref={meshRef}
      position={[node.transform.x, node.transform.y, node.transform.z]}
      rotation={[node.transform.rx, node.transform.ry, node.transform.rz]}
      scale={[node.transform.sx, node.transform.sy, node.transform.sz]}
      onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {geom}
      <meshStandardMaterial
        color={hovered ? "#FFFFFF" : color}
        wireframe={wireframe}
        transparent={xray}
        opacity={xray ? 0.3 : 1}
        emissive={selected ? color : "#000000"}
        emissiveIntensity={selected ? 0.3 : 0}
      />
      {selected && <Outlines thickness={0.02} color="#FFFFFF" />}
      {hovered && !selected && <Edges color="#888888" />}
    </mesh>
  );
}

// ─── Privacy Zone ─────────────────────────────────────────────────────────────

function PrivacyZoneMesh({ position, radius, level }: { position: [number, number, number]; radius: number; level: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const time = useRef(0);

  const colors = {
    public: "#22C55E",
    team: "#3B82F6",
    private: "#F59E0B",
    classified: "#EF4444",
  };
  const color = colors[level as keyof typeof colors] || colors.team;

  useFrame(() => {
    time.current += 0.01;
    if (meshRef.current) {
      meshRef.current.rotation.y = time.current * 0.2;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.15} />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>
      <Html center>
        <div style={{
          background: `${color}22`,
          border: `1px solid ${color}`,
          borderRadius: "4px",
          padding: "2px 6px",
          color: color,
          fontSize: "10px",
          fontFamily: "monospace",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}>
          🔒 {level.toUpperCase()} ZONE
        </div>
      </Html>
    </group>
  );
}

// ─── Collaborator Cursor ──────────────────────────────────────────────────────

function CollaboratorCursor({ collaborator }: { collaborator: Collaborator }) {
  const pos = collaborator.cursorPosition || { x: Math.random() * 4 - 2, y: 1, z: Math.random() * 4 - 2 };

  const platformIcons = {
    visionOS: "👁",
    metaQuest: "🥽",
    blender: "🎨",
    web: "🌐",
    iPadOS: "📱",
    tvOS: "📺",
  };

  return (
    <group position={[pos.x, pos.y, pos.z]}>
      <mesh>
        <coneGeometry args={[0.06, 0.2, 8]} />
        <meshBasicMaterial color={collaborator.color} />
      </mesh>
      <Html center distanceFactor={8}>
        <div style={{
          background: collaborator.color + "CC",
          borderRadius: "12px",
          padding: "2px 8px",
          color: "white",
          fontSize: "11px",
          fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}>
          <span>{platformIcons[collaborator.platform]}</span>
          <span>{collaborator.name}</span>
        </div>
      </Html>
    </group>
  );
}

// ─── Scene Contents ───────────────────────────────────────────────────────────

function SceneContents({
  nodes,
  collaborators,
  selectedNodeId,
  onSelectNode,
  showGrid,
  showCollaborators,
  showPrivacyZones,
  renderMode,
}: Omit<ViewportProps, "showGizmo" | "viewMode">) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <pointLight position={[-3, 3, -3]} intensity={0.6} color="#4A90D9" />
      <pointLight position={[3, -2, 3]} intensity={0.4} color="#8B5CF6" />

      {/* Environment */}
      <Stars radius={80} depth={50} count={2000} factor={3} saturation={0} fade speed={0.5} />

      {/* Grid */}
      {showGrid && (
        <Grid
          args={[20, 20]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#2A2A3A"
          sectionSize={2}
          sectionThickness={1}
          sectionColor="#3A3A5A"
          fadeDistance={25}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />
      )}

      {/* Main plasma column */}
      <PlasmaColumn />

      {/* Scene nodes */}
      {nodes.map((node) =>
        node.type !== "group" && node.type !== "volumetric" ? (
          <SceneNodeMesh
            key={node.id}
            node={node}
            selected={selectedNodeId === node.id}
            onSelect={onSelectNode}
            renderMode={renderMode}
          />
        ) : null
      )}

      {/* Privacy zones */}
      {showPrivacyZones && (
        <>
          <PrivacyZoneMesh position={[0, 0, 0]} radius={2.5} level="team" />
          <PrivacyZoneMesh position={[4, 0, -2]} radius={1.5} level="private" />
        </>
      )}

      {/* Collaborator cursors */}
      {showCollaborators &&
        collaborators
          .filter((c) => c.status === "active")
          .map((c) => <CollaboratorCursor key={c.id} collaborator={c} />)
      }

      {/* Contact shadows */}
      <ContactShadows position={[0, -2.6, 0]} opacity={0.4} scale={10} blur={2} far={4} />
    </>
  );
}

// ─── Main Viewport ────────────────────────────────────────────────────────────

export default function SpatialViewport({
  nodes,
  collaborators,
  selectedNodeId,
  onSelectNode,
  showGrid,
  showGizmo,
  showCollaborators,
  showPrivacyZones,
  viewMode,
  renderMode,
}: ViewportProps) {
  const cameraPositions = {
    perspective: [4, 3, 6] as [number, number, number],
    top: [0, 10, 0.001] as [number, number, number],
    front: [0, 0, 10] as [number, number, number],
    right: [10, 0, 0] as [number, number, number],
  };

  return (
    <div className="w-full h-full relative bg-[#0A0A14]">
      <Canvas
        shadows
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        camera={{ position: cameraPositions[viewMode], fov: 50, near: 0.1, far: 1000 }}
        onPointerMissed={() => onSelectNode(null)}
        style={{ background: "linear-gradient(135deg, #0A0A14 0%, #0D0D1F 50%, #0A0A14 100%)" }}
      >
        <Suspense fallback={null}>
          <SceneContents
            nodes={nodes}
            collaborators={collaborators}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
            showGrid={showGrid}
            showCollaborators={showCollaborators}
            showPrivacyZones={showPrivacyZones}
            renderMode={renderMode}
          />
          <OrbitControls
            makeDefault
            enableDamping
            dampingFactor={0.05}
            minDistance={1}
            maxDistance={50}
          />
          {showGizmo && (
            <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
              <GizmoViewport
                axisColors={["#FF4444", "#44FF44", "#4444FF"]}
                labelColor="white"
              />
            </GizmoHelper>
          )}
        </Suspense>
      </Canvas>

      {/* Viewport overlay info */}
      <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-white/60 font-mono">
          {viewMode.toUpperCase()} · {renderMode.toUpperCase()}
        </div>
        {collaborators.filter(c => c.status === "active").length > 0 && (
          <div className="bg-green-500/20 border border-green-500/40 rounded-md px-2 py-1 text-xs text-green-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            {collaborators.filter(c => c.status === "active").length} LIVE
          </div>
        )}
      </div>

      {/* Performance stats */}
      <div className="absolute bottom-3 right-3 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-white/40 font-mono">
          Z-Pinch Plasma · RealityKit · Metal
        </div>
      </div>
    </div>
  );
}
