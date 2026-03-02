/**
 * IoT Hardware Marketplace — /hardware
 * 12 patentable IoT devices across 4 municipal verticals
 * Includes: procurement cart, quantity controls, PDF quote generation, Capital Hub submission
 * Design: Civic Intelligence Light
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useCallback } from "react";
import {
  Cpu, Droplets, Zap, Shield, Wrench, TreePine, ShoppingCart,
  FileText, ChevronRight, CheckCircle2, Plus, Minus, Trash2,
  Download, Send, X, ArrowRight, Building2, Package
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

const IOT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/116029439/ZyKC8HNSGdSzNP3yqHmgR7/hero-iot-5hFv5WMjMMbm3WsfR2KtFF.webp";

const CATEGORIES = ["All", "Utility Valves & Sensors", "Law Enforcement", "Public Works", "Parks & Recreation"];

const DEVICES = [
  {
    id: "SV-PRO-1", name: "SmartValve Pro", category: "Utility Valves & Sensors",
    icon: Droplets, color: "oklch(0.45 0.20 240)", price: 1249, unitPrice: "$1,249",
    patentStatus: "Pending", patentId: "US2024/0183421",
    description: "Integrated pressure, flow rate, and acoustic leak detection for municipal water distribution. Real-time telemetry via LoRaWAN with 10-year battery life.",
    specs: ["Pressure range: 0–300 PSI (±0.1% accuracy)", "Flow measurement: 0.1–100 GPM", "Acoustic leak detection: 20Hz–20kHz", "Communication: LoRaWAN + BLE 5.0", "Battery: 10-year lithium pack", "IP rating: IP68 (submersible to 3m)", "Operating temp: -40°F to 185°F"],
    claims: "Novel integration of acoustic emission sensing with pressure-compensated flow measurement in a single inline valve body with self-calibrating firmware.",
    badge: "FLAGSHIP", dept: "Public Works / Utilities",
  },
  {
    id: "AQ-SENT-1", name: "AquaSentinel Node", category: "Utility Valves & Sensors",
    icon: Droplets, color: "oklch(0.45 0.20 240)", price: 2180, unitPrice: "$2,180",
    patentStatus: "Filed", patentId: "US2024/0219847",
    description: "Multi-parameter water quality monitoring for municipal distribution and wastewater. Measures pH, turbidity, chlorine, conductivity, and temperature simultaneously.",
    specs: ["pH: 0–14 (±0.02 accuracy)", "Turbidity: 0–4000 NTU", "Free chlorine: 0–20 mg/L", "Conductivity: 0–100 mS/cm", "Communication: 4G LTE-M + LoRa", "Self-cleaning optical sensors", "EPA Method 180.1 compliant"],
    claims: "Simultaneous multi-parameter optical sensing array with adaptive self-cleaning mechanism and predictive fouling detection algorithm.",
    badge: "EPA COMPLIANT", dept: "Utilities",
  },
  {
    id: "GP-MON-1", name: "GasPulse Monitor", category: "Utility Valves & Sensors",
    icon: Zap, color: "oklch(0.45 0.20 240)", price: 895, unitPrice: "$895",
    patentStatus: "Pending", patentId: "US2024/0251093",
    description: "Natural gas distribution monitoring with methane leak detection, pressure regulation feedback, and automated shutoff trigger for municipal gas networks.",
    specs: ["Methane detection: 0–100% LEL", "Pressure monitoring: 0–500 PSI", "Response time: <2 seconds", "Automated shutoff: <500ms trigger", "Communication: Zigbee + cellular", "ATEX Zone 1 certified", "Tamper-evident housing"],
    claims: "Catalytic bead sensor array with pressure-differential leak localization and autonomous shutoff valve actuation protocol.",
    badge: "ATEX CERTIFIED", dept: "Utilities",
  },
  {
    id: "SENT-NODE-1", name: "DOGE Sentinel Node", category: "Law Enforcement",
    icon: Shield, color: "oklch(0.50 0.22 25)", price: 3450, unitPrice: "$3,450",
    patentStatus: "Filed", patentId: "US2024/0298156",
    description: "Evidence room environmental and tamper monitoring. Tracks temperature, humidity, vibration, and unauthorized access with blockchain-anchored audit log.",
    specs: ["Temperature: ±0.1°C accuracy", "Humidity: ±1% RH", "Vibration: 3-axis MEMS accelerometer", "Access detection: PIR + door contact", "Blockchain: SHA-256 event hashing", "Tamper-evident enclosure", "UPS backup: 72-hour"],
    claims: "Cryptographically-anchored environmental monitoring with tamper-evident sensor fusion for chain-of-custody integrity in evidence storage facilities.",
    badge: "CHAIN OF CUSTODY", dept: "Police Department",
  },
  {
    id: "SEC-ENTRY-1", name: "SecureEntry Biometric Panel", category: "Law Enforcement",
    icon: Shield, color: "oklch(0.50 0.22 25)", price: 4890, unitPrice: "$4,890",
    patentStatus: "Pending", patentId: "US2024/0312847",
    description: "Multi-factor biometric access control for secure facilities. Fingerprint + iris + PIN with liveness detection and anti-spoofing AI.",
    specs: ["Fingerprint: 500 DPI optical sensor", "Iris: 1.3MP NIR camera", "Liveness detection: 3D depth map", "Anti-spoofing: CNN-based AI", "Response time: <800ms", "FIPS 201-2 compliant", "Offline operation: 30-day cache"],
    claims: "Tri-modal biometric fusion with neural liveness detection and cryptographic credential binding for FIPS 201-2 compliant physical access control.",
    badge: "FIPS 201-2", dept: "Police Department",
  },
  {
    id: "PATROL-MESH-1", name: "PatrolMesh Hub", category: "Law Enforcement",
    icon: Shield, color: "oklch(0.50 0.22 25)", price: 2100, unitPrice: "$2,100",
    patentStatus: "Filed", patentId: "US2024/0334521",
    description: "Vehicle-mounted body camera synchronization hub with automatic evidence upload, GPS tagging, and officer wellness monitoring.",
    specs: ["Camera sync: 8 simultaneous streams", "Storage: 2TB NVMe onboard", "GPS: ±1m accuracy", "Upload: LTE-A + WiFi 6", "Officer biometrics: HR + stress index", "Encryption: AES-256", "MIL-STD-810H rated"],
    claims: "Distributed mesh synchronization protocol for simultaneous multi-camera evidence capture with biometric officer wellness monitoring and automated chain-of-custody upload.",
    badge: "MIL-STD-810H", dept: "Police Department",
  },
  {
    id: "ROAD-SENSE-1", name: "RoadSense Pavement Monitor", category: "Public Works",
    icon: Wrench, color: "oklch(0.55 0.18 75)", price: 780, unitPrice: "$780",
    patentStatus: "Pending", patentId: "US2024/0356892",
    description: "Embedded pavement health monitoring for predictive maintenance. Measures surface temperature, moisture, freeze-thaw cycles, and structural strain.",
    specs: ["Surface temp: -40°C to +80°C", "Moisture content: 0–100%", "Freeze-thaw cycle counter", "Strain gauge: ±0.001% resolution", "Solar + piezoelectric power", "LoRaWAN 10km range", "20-year design life"],
    claims: "Embedded multi-sensor pavement health monitoring with piezoelectric energy harvesting and predictive maintenance ML inference at the edge.",
    badge: "SOLAR POWERED", dept: "Public Works",
  },
  {
    id: "STORM-NET-1", name: "StormNet Drain Sensor", category: "Public Works",
    icon: Wrench, color: "oklch(0.55 0.18 75)", price: 420, unitPrice: "$420",
    patentStatus: "Filed", patentId: "US2024/0378234",
    description: "Storm drain level monitoring and blockage detection for flood prevention. Ultrasonic level sensing with debris detection and automated alert dispatch.",
    specs: ["Level range: 0–3m (±5mm)", "Debris detection: ultrasonic + optical", "Alert dispatch: <30 second latency", "Battery: 5-year lithium", "IP68 + IK10 rated", "LoRaWAN + NB-IoT", "Corrosion-resistant housing"],
    claims: "Dual-mode ultrasonic and optical debris detection for storm drain monitoring with predictive blockage modeling and automated maintenance dispatch.",
    badge: "FLOOD PREVENTION", dept: "Public Works",
  },
  {
    id: "BRIDGE-WATCH-1", name: "BridgeWatch Monitor", category: "Public Works",
    icon: Wrench, color: "oklch(0.55 0.18 75)", price: 5600, unitPrice: "$5,600",
    patentStatus: "Pending", patentId: "US2024/0401567",
    description: "Structural health monitoring for bridges and overpasses. 12-axis vibration analysis, corrosion detection, and load capacity estimation.",
    specs: ["Vibration: 12-axis MEMS array", "Corrosion: electrochemical potential", "Load estimation: strain + FEA model", "Seismic detection: 0.001g threshold", "Communication: satellite + cellular", "Solar powered with battery backup", "AASHTO LRFD compliant"],
    claims: "Distributed structural health monitoring network with real-time finite element analysis inference and corrosion propagation modeling for bridge asset management.",
    badge: "AASHTO COMPLIANT", dept: "Public Works",
  },
  {
    id: "PARK-PULSE-1", name: "ParkPulse Occupancy Node", category: "Parks & Recreation",
    icon: TreePine, color: "oklch(0.45 0.18 145)", price: 340, unitPrice: "$340",
    patentStatus: "Filed", patentId: "US2024/0423891",
    description: "Park facility occupancy and usage analytics. Privacy-preserving people counting, noise monitoring, and amenity utilization tracking.",
    specs: ["Occupancy: thermal array (no video)", "Noise: 30–120 dB (A-weighted)", "Amenity sensors: pressure mat + IR", "Privacy: no PII, aggregate only", "Solar powered", "LoRaWAN + WiFi", "Weather resistant: IP65"],
    claims: "Privacy-preserving thermal occupancy sensing with multi-modal amenity utilization analytics for municipal park resource optimization.",
    badge: "PRIVACY FIRST", dept: "Parks & Recreation",
  },
  {
    id: "IRRI-SMART-1", name: "IrriSmart Soil Sensor", category: "Parks & Recreation",
    icon: TreePine, color: "oklch(0.45 0.18 145)", price: 195, unitPrice: "$195",
    patentStatus: "Pending", patentId: "US2024/0445123",
    description: "Precision soil moisture and nutrient monitoring for parks and athletic fields. Automated irrigation scheduling with weather forecast integration.",
    specs: ["Soil moisture: ±1% VWC accuracy", "Soil temperature: ±0.2°C", "NPK nutrient sensing", "Weather API integration", "Irrigation control: 24V solenoid", "Battery: 3-year lithium", "Depth: 6\", 12\", 18\" probes"],
    claims: "Multi-depth soil moisture and nutrient sensing with predictive irrigation scheduling algorithm integrating real-time weather forecast data for water conservation.",
    badge: "WATER SAVING", dept: "Parks & Recreation",
  },
  {
    id: "TRAIL-CAM-1", name: "TrailCam Safety Node", category: "Parks & Recreation",
    icon: TreePine, color: "oklch(0.45 0.18 145)", price: 890, unitPrice: "$890",
    patentStatus: "Filed", patentId: "US2024/0467345",
    description: "Trail and wildlife monitoring with edge AI for safety alerts. Detects wildlife, unauthorized access, and environmental hazards without storing personal video.",
    specs: ["Camera: 4K HDR + thermal", "Edge AI: wildlife/hazard classification", "Privacy: on-device inference, no cloud video", "Night vision: 100m range", "Solar + battery hybrid", "Cellular + LoRa backup", "Vandal-resistant housing"],
    claims: "Edge-inference wildlife and hazard detection system with privacy-preserving on-device video processing and automated municipal safety alert dispatch.",
    badge: "EDGE AI", dept: "Parks & Recreation",
  },
];

type CartItem = { deviceId: string; qty: number };

function generatePOText(cartItems: CartItem[], devices: typeof DEVICES, dept: string, requestor: string): string {
  const now = new Date();
  const poNumber = `WL-PO-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 9000 + 1000)}`;
  const lines: string[] = [];
  lines.push("CITY OF WEST LIBERTY, IOWA");
  lines.push("111 W 7th Street, West Liberty, IA 52776");
  lines.push("(319) 627-2418 | cityhall@westlibertyia.gov");
  lines.push("─".repeat(60));
  lines.push(`PURCHASE ORDER — ${poNumber}`);
  lines.push(`Date: ${now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`);
  lines.push(`Requesting Department: ${dept || "City Administration"}`);
  lines.push(`Requested by: ${requestor || "Department Head"}`);
  lines.push("─".repeat(60));
  lines.push("DOGE Municipal Platform — IoT Hardware Marketplace");
  lines.push("Vendor: DOGE Municipal Technologies, LLC");
  lines.push("─".repeat(60));
  lines.push("");
  lines.push(String("QTY").padEnd(6) + String("DEVICE").padEnd(32) + String("UNIT PRICE").padEnd(14) + "TOTAL");
  lines.push("─".repeat(60));
  let subtotal = 0;
  for (const item of cartItems) {
    const d = devices.find(x => x.id === item.deviceId);
    if (!d) continue;
    const lineTotal = d.price * item.qty;
    subtotal += lineTotal;
    lines.push(
      String(item.qty).padEnd(6) +
      d.name.substring(0, 30).padEnd(32) +
      `$${d.price.toLocaleString()}`.padEnd(14) +
      `$${lineTotal.toLocaleString()}`
    );
    lines.push(`      Patent: ${d.patentId} (${d.patentStatus})`);
    lines.push(`      Dept: ${d.dept}`);
  }
  lines.push("─".repeat(60));
  const tax = subtotal * 0.07;
  const total = subtotal + tax;
  lines.push(`${"".padEnd(52)}Subtotal: $${subtotal.toLocaleString()}`);
  lines.push(`${"".padEnd(52)}Tax (7%): $${tax.toFixed(2)}`);
  lines.push(`${"".padEnd(52)}TOTAL:    $${total.toFixed(2)}`);
  lines.push("─".repeat(60));
  lines.push("");
  lines.push("CAPITAL HUB FUNDING REQUEST");
  lines.push(`Requested Instrument: IoT Infrastructure Bond / General Fund`);
  lines.push(`Funding Amount: $${total.toFixed(2)}`);
  lines.push(`Project: West Liberty IoT Sensor Network Expansion`);
  lines.push("");
  lines.push("Authorized Signature: _______________________  Date: _________");
  lines.push("City Administrator: Matt Muckler");
  lines.push("");
  lines.push("This purchase order is subject to West Liberty City Council approval.");
  lines.push("Iowa Code Chapter 384 — Municipal Procurement Requirements apply.");
  return lines.join("\n");
}

export default function HardwareMarketplace() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedDevice, setSelectedDevice] = useState<typeof DEVICES[0] | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [poStep, setPoStep] = useState<"cart" | "form" | "submitted">("cart");
  const [poForm, setPoForm] = useState({ dept: "", requestor: "", notes: "" });

  const filtered = activeCategory === "All" ? DEVICES : DEVICES.filter(d => d.category === activeCategory);

  const addToCart = useCallback((id: string, name: string) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.deviceId === id);
      if (existing) return prev.map(i => i.deviceId === id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { deviceId: id, qty: 1 }];
    });
    toast.success(`${name} added to procurement cart`);
    setCartOpen(true);
  }, []);

  const updateQty = (id: string, delta: number) => {
    setCartItems(prev => {
      const updated = prev.map(i => i.deviceId === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i);
      return updated.filter(i => i.qty > 0);
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(i => i.deviceId !== id));
  };

  const cartTotal = cartItems.reduce((sum, item) => {
    const d = DEVICES.find(x => x.id === item.deviceId);
    return sum + (d ? d.price * item.qty : 0);
  }, 0);

  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const downloadPO = () => {
    const text = generatePOText(cartItems, DEVICES, poForm.dept, poForm.requestor);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `WestLiberty_PO_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Purchase order downloaded");
  };

  const submitToCapitalHub = () => {
    if (!poForm.dept || !poForm.requestor) {
      toast.error("Please fill in department and requestor name.");
      return;
    }
    setPoStep("submitted");
    toast.success("Purchase order submitted to Capital Hub for funding approval.");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.975 0.004 240)" }}>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: "36vh" }}>
        <div className="absolute inset-0">
          <img src={IOT_IMG} alt="IoT Hardware" className="w-full h-full object-cover" style={{ opacity: 0.35 }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, oklch(0.09 0.012 250 / 95%) 40%, oklch(0.09 0.012 250 / 75%) 100%)" }} />
        </div>
        <div className="relative container flex flex-col justify-center py-14">
          <div className="flex items-center gap-2 mb-4">
            <span className="badge-warning">12 PATENTABLE DEVICES</span>
            <span className="badge-info">MUNICIPAL PROCUREMENT</span>
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.95 0.008 240)" }}>
            IoT Hardware Marketplace
          </h1>
          <p className="text-sm max-w-xl mb-5" style={{ color: "oklch(0.65 0.010 250)" }}>
            Purpose-built sensors and smart devices for every city department.
            Add items to your procurement cart, generate a purchase order, and submit directly to the Capital Hub for funding approval.
          </p>
          <button
            onClick={() => setCartOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded font-semibold text-sm self-start transition-all"
            style={{
              background: cartCount > 0 ? "oklch(0.45 0.20 240)" : "oklch(0.45 0.20 240 / 15%)",
              border: "1px solid oklch(0.58 0.20 240 / 40%)",
              color: cartCount > 0 ? "oklch(0.97 0.004 240)" : "oklch(0.65 0.010 250)",
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            Procurement Cart
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: "oklch(0.58 0.22 25)", color: "white" }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </section>

      {/* Category filter */}
      <div className="border-b sticky top-14 z-40" style={{ background: "oklch(0.975 0.004 240 / 95%)", borderColor: "oklch(0 0 0 / 8%)", backdropFilter: "blur(12px)" }}>
        <div className="container flex gap-1 py-3 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: activeCategory === cat ? "oklch(0.45 0.20 240 / 10%)" : "transparent",
                color: activeCategory === cat ? "oklch(0.40 0.18 240)" : "oklch(0.42 0.012 250)",
                border: activeCategory === cat ? "1px solid oklch(0.45 0.20 240 / 25%)" : "1px solid transparent",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Device grid */}
      <section className="py-10">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((device) => {
              const inCart = cartItems.find(i => i.deviceId === device.id);
              return (
                <div
                  key={device.id}
                  className="rounded-lg overflow-hidden transition-all"
                  style={{ background: "oklch(1 0 0)", border: `1px solid ${inCart ? device.color.replace(")", " / 30%)") : "oklch(0 0 0 / 8%)"}` }}
                >
                  {/* Card header */}
                  <div className="p-4 border-b" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: `${device.color.replace(")", " / 12%)")}`, border: `1px solid ${device.color.replace(")", " / 22%)")}` }}
                      >
                        <device.icon className="w-5 h-5" style={{ color: device.color }} />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wider"
                          style={{ background: `${device.color.replace(")", " / 10%)")}`, color: device.color, border: `1px solid ${device.color.replace(")", " / 18%)")}` }}
                        >
                          {device.badge}
                        </span>
                        <span className="text-[9px] font-mono" style={{ color: "oklch(0.52 0.010 250)" }}>
                          {device.patentId}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-sm font-bold mb-1" style={{ color: "oklch(0.18 0.018 250)", fontFamily: "'Syne', sans-serif" }}>
                      {device.name}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: "oklch(0.48 0.012 250)" }}>
                      {device.description}
                    </p>
                  </div>

                  {/* Specs preview */}
                  <div className="px-4 py-3 border-b" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
                    <div className="section-label mb-2">Key Specs</div>
                    <div className="space-y-1">
                      {device.specs.slice(0, 3).map((spec, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px]" style={{ color: "oklch(0.42 0.012 250)" }}>
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: device.color }} />
                          {spec}
                        </div>
                      ))}
                      {device.specs.length > 3 && (
                        <button
                          onClick={() => setSelectedDevice(device)}
                          className="text-[10px] flex items-center gap-1 mt-1"
                          style={{ color: device.color, background: "none", border: "none", cursor: "pointer" }}
                        >
                          +{device.specs.length - 3} more specs <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Patent claim */}
                  <div className="px-4 py-3 border-b" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
                    <div className="section-label mb-1.5">Patent Claim Summary</div>
                    <p className="text-[10px] leading-relaxed italic" style={{ color: "oklch(0.50 0.010 250)" }}>
                      "{device.claims}"
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`badge-${device.patentStatus === "Filed" ? "info" : "warning"}`}>
                        Patent {device.patentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Price + CTA */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="metric-value text-lg" style={{ color: device.color }}>{device.unitPrice}</div>
                      <div className="text-[10px]" style={{ color: "oklch(0.48 0.012 250)" }}>per unit · FOB West Liberty</div>
                    </div>
                    <div className="flex gap-2 items-center">
                      <button
                        onClick={() => setSelectedDevice(device)}
                        className="p-2 rounded transition-all"
                        style={{ background: "oklch(0 0 0 / 5%)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.42 0.012 250)" }}
                        title="View full specs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      {inCart ? (
                        <div className="flex items-center gap-1.5 rounded px-2 py-1" style={{ background: `${device.color.replace(")", " / 10%)")}`, border: `1px solid ${device.color.replace(")", " / 25%)")}` }}>
                          <button onClick={() => updateQty(device.id, -1)} className="w-5 h-5 flex items-center justify-center rounded" style={{ color: device.color }}>
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-bold w-4 text-center" style={{ color: device.color }}>{inCart.qty}</span>
                          <button onClick={() => updateQty(device.id, 1)} className="w-5 h-5 flex items-center justify-center rounded" style={{ color: device.color }}>
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(device.id, device.name)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all"
                          style={{ background: `${device.color.replace(")", " / 12%)")}`, border: `1px solid ${device.color.replace(")", " / 25%)")}`, color: device.color }}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Device Detail Modal ─────────────────────────────────────────── */}
      {selectedDevice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 60%)" }}
          onClick={() => setSelectedDevice(null)}
        >
          <div
            className="w-full max-w-2xl rounded-xl overflow-hidden"
            style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0 0 0 / 10%)", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${selectedDevice.color.replace(")", " / 12%)")}`, border: `1px solid ${selectedDevice.color.replace(")", " / 22%)")}` }}>
                    <selectedDevice.icon className="w-6 h-6" style={{ color: selectedDevice.color }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>{selectedDevice.name}</h2>
                    <div className="text-xs font-mono mt-0.5" style={{ color: "oklch(0.48 0.012 250)" }}>{selectedDevice.patentId} · Patent {selectedDevice.patentStatus}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedDevice(null)} className="text-2xl leading-none" style={{ color: "oklch(0.48 0.012 250)", background: "none", border: "none", cursor: "pointer" }}>×</button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm leading-relaxed" style={{ color: "oklch(0.42 0.012 250)" }}>{selectedDevice.description}</p>
              <div>
                <div className="section-label mb-3">Full Technical Specifications</div>
                <div className="space-y-1.5">
                  {selectedDevice.specs.map((spec, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "oklch(0.38 0.012 250)" }}>
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: selectedDevice.color }} />
                      {spec}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-lg" style={{ background: "oklch(0.965 0.005 240)", border: "1px solid oklch(0 0 0 / 8%)" }}>
                <div className="section-label mb-2">Patent Claim (Independent Claim 1)</div>
                <p className="text-xs leading-relaxed italic" style={{ color: "oklch(0.42 0.012 250)" }}>
                  A system comprising: {selectedDevice.claims}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <div className="metric-value text-xl" style={{ color: selectedDevice.color }}>{selectedDevice.unitPrice}</div>
                  <div className="text-xs" style={{ color: "oklch(0.48 0.012 250)" }}>per unit · FOB West Liberty, IA</div>
                </div>
                <button
                  onClick={() => { addToCart(selectedDevice.id, selectedDevice.name); setSelectedDevice(null); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-sm"
                  style={{ background: selectedDevice.color, color: "oklch(0.98 0.004 240)" }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Procurement Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Procurement Cart Drawer ─────────────────────────────────────── */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: "oklch(0 0 0 / 50%)" }}
          onClick={() => setCartOpen(false)}
        >
          <div
            className="w-full max-w-md h-full flex flex-col overflow-hidden"
            style={{ background: "oklch(1 0 0)", borderLeft: "1px solid oklch(0 0 0 / 8%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer header */}
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" style={{ color: "oklch(0.40 0.18 240)" }} />
                <span className="font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>
                  Procurement Cart
                </span>
                {cartCount > 0 && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ background: "oklch(0.40 0.18 240 / 10%)", color: "oklch(0.40 0.18 240)" }}>
                    {cartCount} items
                  </span>
                )}
              </div>
              <button onClick={() => setCartOpen(false)} style={{ color: "oklch(0.48 0.012 250)", background: "none", border: "none", cursor: "pointer" }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step tabs */}
            <div className="flex border-b" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
              {[
                { id: "cart", label: "Cart" },
                { id: "form", label: "PO Details" },
                { id: "submitted", label: "Submitted" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => cartItems.length > 0 && setPoStep(tab.id as typeof poStep)}
                  className="flex-1 py-2.5 text-xs font-semibold transition-all"
                  style={{
                    color: poStep === tab.id ? "oklch(0.40 0.18 240)" : "oklch(0.52 0.010 250)",
                    borderBottom: poStep === tab.id ? "2px solid oklch(0.40 0.18 240)" : "2px solid transparent",
                    background: "none",
                    cursor: cartItems.length > 0 ? "pointer" : "default",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Cart step */}
            {poStep === "cart" && (
              <div className="flex-1 overflow-y-auto">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center px-6">
                    <Package className="w-8 h-8 mb-3" style={{ color: "oklch(0.72 0.010 250)" }} />
                    <p className="text-sm font-semibold mb-1" style={{ color: "oklch(0.35 0.018 250)" }}>Cart is empty</p>
                    <p className="text-xs" style={{ color: "oklch(0.52 0.010 250)" }}>Add devices from the marketplace to build your procurement order.</p>
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: "oklch(0 0 0 / 6%)" }}>
                    {cartItems.map((item) => {
                      const d = DEVICES.find(x => x.id === item.deviceId);
                      if (!d) return null;
                      return (
                        <div key={item.deviceId} className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <div
                              className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
                              style={{ background: `${d.color.replace(")", " / 12%)")}`, border: `1px solid ${d.color.replace(")", " / 22%)")}` }}
                            >
                              <d.icon className="w-4 h-4" style={{ color: d.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold mb-0.5" style={{ color: "oklch(0.18 0.018 250)" }}>{d.name}</div>
                              <div className="text-[10px] mb-2" style={{ color: "oklch(0.52 0.010 250)" }}>{d.dept} · {d.patentId}</div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 rounded px-1.5 py-0.5" style={{ background: "oklch(0.965 0.005 240)", border: "1px solid oklch(0 0 0 / 8%)" }}>
                                  <button onClick={() => updateQty(item.deviceId, -1)} style={{ color: "oklch(0.42 0.012 250)", background: "none", border: "none", cursor: "pointer" }}>
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-xs font-mono font-bold w-5 text-center" style={{ color: "oklch(0.22 0.018 250)" }}>{item.qty}</span>
                                  <button onClick={() => updateQty(item.deviceId, 1)} style={{ color: "oklch(0.42 0.012 250)", background: "none", border: "none", cursor: "pointer" }}>
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="text-xs font-mono font-bold" style={{ color: d.color }}>
                                  ${(d.price * item.qty).toLocaleString()}
                                </span>
                                <button onClick={() => removeFromCart(item.deviceId)} className="ml-auto" style={{ color: "oklch(0.60 0.18 25)", background: "none", border: "none", cursor: "pointer" }}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* PO Form step */}
            {poStep === "form" && (
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(0.30 0.018 250)" }}>Requesting Department *</label>
                  <input
                    type="text"
                    value={poForm.dept}
                    onChange={e => setPoForm(f => ({ ...f, dept: e.target.value }))}
                    placeholder="e.g. Public Works"
                    className="w-full px-3 py-2 rounded text-sm outline-none"
                    style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 12%)", color: "oklch(0.18 0.018 250)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(0.30 0.018 250)" }}>Requested By *</label>
                  <input
                    type="text"
                    value={poForm.requestor}
                    onChange={e => setPoForm(f => ({ ...f, requestor: e.target.value }))}
                    placeholder="e.g. John Smith, Public Works Director"
                    className="w-full px-3 py-2 rounded text-sm outline-none"
                    style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 12%)", color: "oklch(0.18 0.018 250)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "oklch(0.30 0.018 250)" }}>Notes / Justification</label>
                  <textarea
                    value={poForm.notes}
                    onChange={e => setPoForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Describe the project need and deployment location..."
                    rows={3}
                    className="w-full px-3 py-2 rounded text-sm outline-none resize-none"
                    style={{ background: "oklch(0.975 0.004 240)", border: "1px solid oklch(0 0 0 / 12%)", color: "oklch(0.18 0.018 250)" }}
                  />
                </div>
                {/* Order summary */}
                <div className="rounded-lg p-3 space-y-1" style={{ background: "oklch(0.965 0.005 240)", border: "1px solid oklch(0 0 0 / 8%)" }}>
                  <div className="section-label mb-2">Order Summary</div>
                  {cartItems.map(item => {
                    const d = DEVICES.find(x => x.id === item.deviceId);
                    if (!d) return null;
                    return (
                      <div key={item.deviceId} className="flex justify-between text-xs" style={{ color: "oklch(0.38 0.012 250)" }}>
                        <span>{item.qty}× {d.name}</span>
                        <span className="font-mono">${(d.price * item.qty).toLocaleString()}</span>
                      </div>
                    );
                  })}
                  <div className="border-t pt-1 mt-1 flex justify-between text-xs font-bold" style={{ borderColor: "oklch(0 0 0 / 8%)", color: "oklch(0.22 0.018 250)" }}>
                    <span>Subtotal</span>
                    <span className="font-mono">${cartTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold" style={{ color: "oklch(0.40 0.18 240)" }}>
                    <span>Total (incl. 7% tax)</span>
                    <span className="font-mono">${(cartTotal * 1.07).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submitted step — Capital Hub Funding Status Tracker */}
            {poStep === "submitted" && (
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                {/* Confirmation header */}
                <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "oklch(0.38 0.18 145 / 8%)", border: "1px solid oklch(0.38 0.18 145 / 22%)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "oklch(0.38 0.18 145 / 18%)" }}>
                    <CheckCircle2 className="w-5 h-5" style={{ color: "oklch(0.32 0.18 145)" }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.18 0.018 250)" }}>PO Submitted to Capital Hub</div>
                    <div className="text-[10px] font-mono mt-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>Ref: WL-PO-{new Date().getFullYear()}-{String(new Date().getMonth() + 1).padStart(2, "0")}{String(new Date().getDate()).padStart(2, "0")}-{Math.floor(Math.random() * 9000 + 1000)}</div>
                  </div>
                </div>

                {/* Live status tracker */}
                <div>
                  <div className="section-label mb-3">Capital Hub Funding Status</div>
                  <div className="space-y-0">
                    {[
                      { step: 1, label: "PO Submitted", desc: "Purchase order received by Capital Hub", status: "complete", time: "Just now" },
                      { step: 2, label: "Under Review", desc: "City Administrator reviewing funding request", status: "active", time: "Est. 24 hrs" },
                      { step: 3, label: "Council Approval", desc: "Iowa Code §384 procurement approval", status: "pending", time: "Est. 3–5 days" },
                      { step: 4, label: "Approved", desc: "Funds released — vendor notified", status: "pending", time: "Est. 5–7 days" },
                    ].map((s, i, arr) => (
                      <div key={s.step} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                            style={{
                              background: s.status === "complete" ? "oklch(0.38 0.18 145)" : s.status === "active" ? "oklch(0.40 0.18 240)" : "oklch(0.92 0.004 250)",
                              color: s.status === "pending" ? "oklch(0.55 0.010 250)" : "oklch(0.98 0.004 0)",
                              border: s.status === "active" ? "2px solid oklch(0.40 0.18 240 / 40%)" : "none",
                            }}
                          >
                            {s.status === "complete" ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.step}
                          </div>
                          {i < arr.length - 1 && (
                            <div className="w-0.5 h-8 my-0.5" style={{ background: s.status === "complete" ? "oklch(0.38 0.18 145 / 40%)" : "oklch(0 0 0 / 8%)" }} />
                          )}
                        </div>
                        <div className="pb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold" style={{ color: s.status === "pending" ? "oklch(0.52 0.010 250)" : "oklch(0.18 0.018 250)" }}>{s.label}</span>
                            {s.status === "active" && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded animate-pulse" style={{ background: "oklch(0.40 0.18 240 / 12%)", color: "oklch(0.40 0.18 240)" }}>IN PROGRESS</span>
                            )}
                          </div>
                          <div className="text-[10px] mt-0.5" style={{ color: "oklch(0.52 0.010 250)" }}>{s.desc}</div>
                          <div className="text-[9px] font-mono mt-0.5" style={{ color: "oklch(0.62 0.010 250)" }}>{s.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order amount summary */}
                <div className="rounded-lg p-3" style={{ background: "oklch(0.965 0.005 240)", border: "1px solid oklch(0 0 0 / 8%)" }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider" style={{ color: "oklch(0.52 0.010 250)" }}>Funding Requested</div>
                      <div className="text-lg font-mono font-bold mt-0.5" style={{ color: "oklch(0.40 0.18 240)" }}>${(cartTotal * 1.07).toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider" style={{ color: "oklch(0.52 0.010 250)" }}>Dept</div>
                      <div className="text-xs font-semibold mt-0.5" style={{ color: "oklch(0.28 0.018 250)" }}>{poForm.dept || "City Administration"}</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={downloadPO}
                    className="flex items-center justify-center gap-2 w-full py-2 rounded text-sm font-semibold"
                    style={{ background: "oklch(0.40 0.18 240 / 10%)", border: "1px solid oklch(0.40 0.18 240 / 25%)", color: "oklch(0.40 0.18 240)" }}
                  >
                    <Download className="w-4 h-4" />
                    Download PO (.txt)
                  </button>
                  <Link
                    href="/capital-hub"
                    className="flex items-center justify-center gap-2 w-full py-2 rounded text-sm font-semibold no-underline"
                    style={{ background: "oklch(0.38 0.18 145)", color: "oklch(0.98 0.004 145)" }}
                    onClick={() => setCartOpen(false)}
                  >
                    <Building2 className="w-4 h-4" />
                    View Capital Hub
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* Footer actions */}
            {poStep !== "submitted" && (
              <div className="px-5 py-4 border-t" style={{ borderColor: "oklch(0 0 0 / 8%)" }}>
                {poStep === "cart" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-bold mb-3" style={{ color: "oklch(0.18 0.018 250)" }}>
                      <span>Subtotal</span>
                      <span className="font-mono" style={{ color: "oklch(0.40 0.18 240)" }}>${cartTotal.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => cartItems.length > 0 && setPoStep("form")}
                      disabled={cartItems.length === 0}
                      className="w-full py-2.5 rounded font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                      style={{
                        background: cartItems.length > 0 ? "oklch(0.40 0.18 240)" : "oklch(0 0 0 / 8%)",
                        color: cartItems.length > 0 ? "oklch(0.97 0.004 240)" : "oklch(0.52 0.010 250)",
                        cursor: cartItems.length > 0 ? "pointer" : "not-allowed",
                      }}
                    >
                      <FileText className="w-4 h-4" />
                      Generate Purchase Order
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {poStep === "form" && (
                  <div className="flex gap-2">
                    <button
                      onClick={downloadPO}
                      className="flex-1 py-2.5 rounded font-semibold text-sm flex items-center justify-center gap-2"
                      style={{ background: "oklch(0 0 0 / 5%)", border: "1px solid oklch(0 0 0 / 10%)", color: "oklch(0.35 0.018 250)" }}
                    >
                      <Download className="w-4 h-4" />
                      Download PO
                    </button>
                    <button
                      onClick={submitToCapitalHub}
                      className="flex-1 py-2.5 rounded font-semibold text-sm flex items-center justify-center gap-2"
                      style={{ background: "oklch(0.38 0.18 145)", color: "oklch(0.98 0.004 145)" }}
                    >
                      <Send className="w-4 h-4" />
                      Submit to Capital Hub
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
