/**
 * IoT Hardware Marketplace — Civic Intelligence Dark
 * 12 patentable IoT devices across 4 municipal verticals
 * Patent claim summaries, specs, procurement pricing
 */
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Cpu, Droplets, Zap, Shield, Wrench, TreePine, ShoppingCart, FileText, ChevronRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const IOT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/116029439/ZyKC8HNSGdSzNP3yqHmgR7/hero-iot-5hFv5WMjMMbm3WsfR2KtFF.webp";

const CATEGORIES = ["All", "Utility Valves & Sensors", "Law Enforcement", "Public Works", "Parks & Recreation"];

const DEVICES = [
  {
    id: "SV-PRO-1",
    name: "SmartValve Pro",
    category: "Utility Valves & Sensors",
    icon: Droplets,
    color: "oklch(0.58 0.20 240)",
    price: 1249,
    unitPrice: "$1,249",
    patentStatus: "Pending",
    patentId: "US2024/0183421",
    description: "Integrated pressure, flow rate, and acoustic leak detection for municipal water distribution. Real-time telemetry via LoRaWAN with 10-year battery life.",
    specs: [
      "Pressure range: 0–300 PSI (±0.1% accuracy)",
      "Flow measurement: 0.1–100 GPM",
      "Acoustic leak detection: 20Hz–20kHz",
      "Communication: LoRaWAN + BLE 5.0",
      "Battery: 10-year lithium pack",
      "IP rating: IP68 (submersible to 3m)",
      "Operating temp: -40°F to 185°F",
    ],
    claims: "Novel integration of acoustic emission sensing with pressure-compensated flow measurement in a single inline valve body with self-calibrating firmware.",
    badge: "FLAGSHIP",
  },
  {
    id: "AQ-SENT-1",
    name: "AquaSentinel Node",
    category: "Utility Valves & Sensors",
    icon: Droplets,
    color: "oklch(0.58 0.20 240)",
    price: 2180,
    unitPrice: "$2,180",
    patentStatus: "Filed",
    patentId: "US2024/0219847",
    description: "Multi-parameter water quality monitoring for municipal distribution and wastewater. Measures pH, turbidity, chlorine, conductivity, and temperature simultaneously.",
    specs: [
      "pH: 0–14 (±0.02 accuracy)",
      "Turbidity: 0–4000 NTU",
      "Free chlorine: 0–20 mg/L",
      "Conductivity: 0–100 mS/cm",
      "Communication: 4G LTE-M + LoRa",
      "Self-cleaning optical sensors",
      "EPA Method 180.1 compliant",
    ],
    claims: "Simultaneous multi-parameter optical sensing array with adaptive self-cleaning mechanism and predictive fouling detection algorithm.",
    badge: "EPA COMPLIANT",
  },
  {
    id: "GP-MON-1",
    name: "GasPulse Monitor",
    category: "Utility Valves & Sensors",
    icon: Zap,
    color: "oklch(0.58 0.20 240)",
    price: 895,
    unitPrice: "$895",
    patentStatus: "Pending",
    patentId: "US2024/0251093",
    description: "Natural gas distribution monitoring with methane leak detection, pressure regulation feedback, and automated shutoff trigger for municipal gas networks.",
    specs: [
      "Methane detection: 0–100% LEL",
      "Pressure monitoring: 0–500 PSI",
      "Response time: <2 seconds",
      "Automated shutoff: <500ms trigger",
      "Communication: Zigbee + cellular",
      "ATEX Zone 1 certified",
      "Tamper-evident housing",
    ],
    claims: "Catalytic bead sensor array with pressure-differential leak localization and autonomous shutoff valve actuation protocol.",
    badge: "ATEX CERTIFIED",
  },
  {
    id: "SENT-NODE-1",
    name: "DOGE Sentinel Node",
    category: "Law Enforcement",
    icon: Shield,
    color: "oklch(0.62 0.22 25)",
    price: 3450,
    unitPrice: "$3,450",
    patentStatus: "Filed",
    patentId: "US2024/0298156",
    description: "Evidence room environmental and tamper monitoring. Tracks temperature, humidity, vibration, and unauthorized access with blockchain-anchored audit log.",
    specs: [
      "Temperature: ±0.1°C accuracy",
      "Humidity: ±1% RH",
      "Vibration: 3-axis MEMS accelerometer",
      "Access detection: PIR + door contact",
      "Blockchain: SHA-256 event hashing",
      "Tamper-evident enclosure",
      "UPS backup: 72-hour",
    ],
    claims: "Cryptographically-anchored environmental monitoring with tamper-evident sensor fusion for chain-of-custody integrity in evidence storage facilities.",
    badge: "CHAIN OF CUSTODY",
  },
  {
    id: "SEC-ENTRY-1",
    name: "SecureEntry Biometric Panel",
    category: "Law Enforcement",
    icon: Shield,
    color: "oklch(0.62 0.22 25)",
    price: 4890,
    unitPrice: "$4,890",
    patentStatus: "Pending",
    patentId: "US2024/0312847",
    description: "Multi-factor biometric access control for secure facilities. Fingerprint + iris + PIN with liveness detection and anti-spoofing AI.",
    specs: [
      "Fingerprint: 500 DPI optical sensor",
      "Iris: 1.3MP NIR camera",
      "Liveness detection: 3D depth map",
      "Anti-spoofing: CNN-based AI",
      "Response time: <800ms",
      "FIPS 201-2 compliant",
      "Offline operation: 30-day cache",
    ],
    claims: "Tri-modal biometric fusion with neural liveness detection and cryptographic credential binding for FIPS 201-2 compliant physical access control.",
    badge: "FIPS 201-2",
  },
  {
    id: "PATROL-MESH-1",
    name: "PatrolMesh Hub",
    category: "Law Enforcement",
    icon: Shield,
    color: "oklch(0.62 0.22 25)",
    price: 2100,
    unitPrice: "$2,100",
    patentStatus: "Filed",
    patentId: "US2024/0334521",
    description: "Vehicle-mounted body camera synchronization hub with automatic evidence upload, GPS tagging, and officer wellness monitoring.",
    specs: [
      "Camera sync: 8 simultaneous streams",
      "Storage: 2TB NVMe onboard",
      "GPS: ±1m accuracy",
      "Upload: LTE-A + WiFi 6",
      "Officer biometrics: HR + stress index",
      "Encryption: AES-256",
      "MIL-STD-810H rated",
    ],
    claims: "Distributed mesh synchronization protocol for simultaneous multi-camera evidence capture with biometric officer wellness monitoring and automated chain-of-custody upload.",
    badge: "MIL-STD-810H",
  },
  {
    id: "ROAD-SENSE-1",
    name: "RoadSense Pavement Monitor",
    category: "Public Works",
    icon: Wrench,
    color: "oklch(0.75 0.18 75)",
    price: 780,
    unitPrice: "$780",
    patentStatus: "Pending",
    patentId: "US2024/0356892",
    description: "Embedded pavement health monitoring for predictive maintenance. Measures surface temperature, moisture, freeze-thaw cycles, and structural strain.",
    specs: [
      "Surface temp: -40°C to +80°C",
      "Moisture content: 0–100%",
      "Freeze-thaw cycle counter",
      "Strain gauge: ±0.001% resolution",
      "Solar + piezoelectric power",
      "LoRaWAN 10km range",
      "20-year design life",
    ],
    claims: "Embedded multi-sensor pavement health monitoring with piezoelectric energy harvesting and predictive maintenance ML inference at the edge.",
    badge: "SOLAR POWERED",
  },
  {
    id: "STORM-NET-1",
    name: "StormNet Drain Sensor",
    category: "Public Works",
    icon: Wrench,
    color: "oklch(0.75 0.18 75)",
    price: 420,
    unitPrice: "$420",
    patentStatus: "Filed",
    patentId: "US2024/0378234",
    description: "Storm drain level monitoring and blockage detection for flood prevention. Ultrasonic level sensing with debris detection and automated alert dispatch.",
    specs: [
      "Level range: 0–3m (±5mm)",
      "Debris detection: ultrasonic + optical",
      "Alert dispatch: <30 second latency",
      "Battery: 5-year lithium",
      "IP68 + IK10 rated",
      "LoRaWAN + NB-IoT",
      "Corrosion-resistant housing",
    ],
    claims: "Dual-mode ultrasonic and optical debris detection for storm drain monitoring with predictive blockage modeling and automated maintenance dispatch.",
    badge: "FLOOD PREVENTION",
  },
  {
    id: "BRIDGE-WATCH-1",
    name: "BridgeWatch Monitor",
    category: "Public Works",
    icon: Wrench,
    color: "oklch(0.75 0.18 75)",
    price: 5600,
    unitPrice: "$5,600",
    patentStatus: "Pending",
    patentId: "US2024/0401567",
    description: "Structural health monitoring for bridges and overpasses. 12-axis vibration analysis, corrosion detection, and load capacity estimation.",
    specs: [
      "Vibration: 12-axis MEMS array",
      "Corrosion: electrochemical potential",
      "Load estimation: strain + FEA model",
      "Seismic detection: 0.001g threshold",
      "Communication: satellite + cellular",
      "Solar powered with battery backup",
      "AASHTO LRFD compliant",
    ],
    claims: "Distributed structural health monitoring network with real-time finite element analysis inference and corrosion propagation modeling for bridge asset management.",
    badge: "AASHTO COMPLIANT",
  },
  {
    id: "PARK-PULSE-1",
    name: "ParkPulse Occupancy Node",
    category: "Parks & Recreation",
    icon: TreePine,
    color: "oklch(0.65 0.18 145)",
    price: 340,
    unitPrice: "$340",
    patentStatus: "Filed",
    patentId: "US2024/0423891",
    description: "Park facility occupancy and usage analytics. Privacy-preserving people counting, noise monitoring, and amenity utilization tracking.",
    specs: [
      "Occupancy: thermal array (no video)",
      "Noise: 30–120 dB (A-weighted)",
      "Amenity sensors: pressure mat + IR",
      "Privacy: no PII, aggregate only",
      "Solar powered",
      "LoRaWAN + WiFi",
      "Weather resistant: IP65",
    ],
    claims: "Privacy-preserving thermal occupancy sensing with multi-modal amenity utilization analytics for municipal park resource optimization.",
    badge: "PRIVACY FIRST",
  },
  {
    id: "IRRI-SMART-1",
    name: "IrriSmart Soil Sensor",
    category: "Parks & Recreation",
    icon: TreePine,
    color: "oklch(0.65 0.18 145)",
    price: 195,
    unitPrice: "$195",
    patentStatus: "Pending",
    patentId: "US2024/0445123",
    description: "Precision soil moisture and nutrient monitoring for parks and athletic fields. Automated irrigation scheduling with weather forecast integration.",
    specs: [
      "Soil moisture: ±1% VWC accuracy",
      "Soil temperature: ±0.2°C",
      "NPK nutrient sensing",
      "Weather API integration",
      "Irrigation control: 24V solenoid",
      "Battery: 3-year lithium",
      "Depth: 6\", 12\", 18\" probes",
    ],
    claims: "Multi-depth soil moisture and nutrient sensing with predictive irrigation scheduling algorithm integrating real-time weather forecast data for water conservation.",
    badge: "WATER SAVING",
  },
  {
    id: "TRAIL-CAM-1",
    name: "TrailCam Safety Node",
    category: "Parks & Recreation",
    icon: TreePine,
    color: "oklch(0.65 0.18 145)",
    price: 890,
    unitPrice: "$890",
    patentStatus: "Filed",
    patentId: "US2024/0467345",
    description: "Trail and wildlife monitoring with edge AI for safety alerts. Detects wildlife, unauthorized access, and environmental hazards without storing personal video.",
    specs: [
      "Camera: 4K HDR + thermal",
      "Edge AI: wildlife/hazard classification",
      "Privacy: on-device inference, no cloud video",
      "Night vision: 100m range",
      "Solar + battery hybrid",
      "Cellular + LoRa backup",
      "Vandal-resistant housing",
    ],
    claims: "Edge-inference wildlife and hazard detection system with privacy-preserving on-device video processing and automated municipal safety alert dispatch.",
    badge: "EDGE AI",
  },
];

export default function HardwareMarketplace() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedDevice, setSelectedDevice] = useState<typeof DEVICES[0] | null>(null);
  const [cart, setCart] = useState<string[]>([]);

  const filtered = activeCategory === "All" ? DEVICES : DEVICES.filter(d => d.category === activeCategory);

  const addToCart = (id: string, name: string) => {
    setCart(prev => [...prev, id]);
    toast.success(`${name} added to procurement cart`);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.11 0.012 250)" }}>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ minHeight: "40vh" }}>
        <div className="absolute inset-0">
          <img src={IOT_IMG} alt="IoT Hardware" className="w-full h-full object-cover" style={{ opacity: 0.35 }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, oklch(0.09 0.012 250 / 95%) 40%, oklch(0.09 0.012 250 / 75%) 100%)" }} />
        </div>
        <div className="relative container flex flex-col justify-center py-16">
          <div className="flex items-center gap-2 mb-4">
            <span className="badge-warning">12 PATENTABLE DEVICES</span>
            <span className="badge-info">MUNICIPAL PROCUREMENT</span>
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.95 0.008 240)" }}>
            IoT Hardware Marketplace
          </h1>
          <p className="text-sm max-w-xl" style={{ color: "oklch(0.60 0.010 250)" }}>
            Purpose-built sensors and smart devices for every city department.
            Each device includes patent claim documentation, procurement specs, and West Liberty deployment guidance.
          </p>
          {cart.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded" style={{ background: "oklch(0.58 0.20 240 / 15%)", border: "1px solid oklch(0.58 0.20 240 / 30%)" }}>
              <ShoppingCart className="w-4 h-4" style={{ color: "oklch(0.70 0.18 240)" }} />
              <span className="text-sm font-mono" style={{ color: "oklch(0.70 0.18 240)" }}>{cart.length} items in procurement cart</span>
            </div>
          )}
        </div>
      </section>

      {/* Category filter */}
      <div className="border-b sticky top-14 z-40" style={{ background: "oklch(0.13 0.013 250 / 95%)", borderColor: "oklch(1 0 0 / 8%)", backdropFilter: "blur(12px)" }}>
        <div className="container flex gap-1 py-3 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-all flex-shrink-0"
              style={{
                background: activeCategory === cat ? "oklch(0.58 0.20 240 / 15%)" : "transparent",
                color: activeCategory === cat ? "oklch(0.70 0.18 240)" : "oklch(0.55 0.010 250)",
                border: activeCategory === cat ? "1px solid oklch(0.58 0.20 240 / 30%)" : "1px solid transparent",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Device grid */}
      <section className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((device) => (
              <div
                key={device.id}
                className="rounded-lg overflow-hidden transition-all"
                style={{ background: "oklch(0.16 0.014 250)", border: "1px solid oklch(1 0 0 / 8%)" }}
              >
                {/* Card header */}
                <div className="p-4 border-b" style={{ borderColor: "oklch(1 0 0 / 8%)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: `${device.color.replace(")", " / 15%)")}`, border: `1px solid ${device.color.replace(")", " / 25%)")}` }}
                    >
                      <device.icon className="w-5 h-5" style={{ color: device.color }} />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wider"
                        style={{ background: `${device.color.replace(")", " / 12%)")}`, color: device.color, border: `1px solid ${device.color.replace(")", " / 20%)")}` }}
                      >
                        {device.badge}
                      </span>
                      <span className="text-[9px] font-mono" style={{ color: "oklch(0.45 0.008 250)" }}>
                        {device.patentId}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold mb-1" style={{ color: "oklch(0.88 0.008 240)", fontFamily: "'Syne', sans-serif" }}>
                    {device.name}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: "oklch(0.50 0.010 250)" }}>
                    {device.description}
                  </p>
                </div>

                {/* Specs preview */}
                <div className="px-4 py-3 border-b" style={{ borderColor: "oklch(1 0 0 / 8%)" }}>
                  <div className="section-label mb-2">Key Specs</div>
                  <div className="space-y-1">
                    {device.specs.slice(0, 3).map((spec, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[10px]" style={{ color: "oklch(0.50 0.010 250)" }}>
                        <CheckCircle2 className="w-3 h-3 flex-shrink-0" style={{ color: device.color }} />
                        {spec}
                      </div>
                    ))}
                    {device.specs.length > 3 && (
                      <button
                        onClick={() => setSelectedDevice(device)}
                        className="text-[10px] flex items-center gap-1 mt-1"
                        style={{ color: device.color }}
                      >
                        +{device.specs.length - 3} more specs <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Patent claim */}
                <div className="px-4 py-3 border-b" style={{ borderColor: "oklch(1 0 0 / 8%)" }}>
                  <div className="section-label mb-1.5">Patent Claim Summary</div>
                  <p className="text-[10px] leading-relaxed italic" style={{ color: "oklch(0.45 0.008 250)" }}>
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
                    <div className="text-[10px]" style={{ color: "oklch(0.40 0.008 250)" }}>per unit · FOB West Liberty</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedDevice(device)}
                      className="p-2 rounded transition-all"
                      style={{ background: "oklch(1 0 0 / 6%)", border: "1px solid oklch(1 0 0 / 12%)", color: "oklch(0.60 0.010 250)" }}
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => addToCart(device.id, device.name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all"
                      style={{ background: `${device.color.replace(")", " / 15%)")}`, border: `1px solid ${device.color.replace(")", " / 30%)")}`, color: device.color }}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Device detail modal */}
      {selectedDevice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 70%)" }}
          onClick={() => setSelectedDevice(null)}
        >
          <div
            className="w-full max-w-2xl rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto"
            style={{ background: "oklch(0.16 0.014 250)", border: "1px solid oklch(1 0 0 / 12%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b" style={{ borderColor: "oklch(1 0 0 / 8%)" }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${selectedDevice.color.replace(")", " / 15%)")}`, border: `1px solid ${selectedDevice.color.replace(")", " / 25%)")}` }}>
                    <selectedDevice.icon className="w-6 h-6" style={{ color: selectedDevice.color }} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold" style={{ fontFamily: "'Syne', sans-serif", color: "oklch(0.92 0.008 240)" }}>{selectedDevice.name}</h2>
                    <div className="text-xs font-mono mt-0.5" style={{ color: "oklch(0.50 0.010 250)" }}>{selectedDevice.patentId} · Patent {selectedDevice.patentStatus}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedDevice(null)} className="text-2xl leading-none" style={{ color: "oklch(0.50 0.010 250)" }}>×</button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm leading-relaxed" style={{ color: "oklch(0.60 0.010 250)" }}>{selectedDevice.description}</p>
              <div>
                <div className="section-label mb-3">Full Technical Specifications</div>
                <div className="space-y-1.5">
                  {selectedDevice.specs.map((spec, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs" style={{ color: "oklch(0.65 0.010 250)" }}>
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: selectedDevice.color }} />
                      {spec}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-lg" style={{ background: "oklch(0.13 0.013 250)", border: "1px solid oklch(1 0 0 / 8%)" }}>
                <div className="section-label mb-2">Patent Claim (Independent Claim 1)</div>
                <p className="text-xs leading-relaxed italic" style={{ color: "oklch(0.55 0.010 250)" }}>
                  A system comprising: {selectedDevice.claims}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <div className="metric-value text-xl" style={{ color: selectedDevice.color }}>{selectedDevice.unitPrice}</div>
                  <div className="text-xs" style={{ color: "oklch(0.40 0.008 250)" }}>per unit · FOB West Liberty, IA</div>
                </div>
                <button
                  onClick={() => { addToCart(selectedDevice.id, selectedDevice.name); setSelectedDevice(null); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded font-semibold text-sm"
                  style={{ background: selectedDevice.color, color: "oklch(0.10 0.010 250)" }}
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Procurement Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
