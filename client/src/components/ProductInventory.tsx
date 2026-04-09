/* ProductInventory — Product inventory with overspray risk indicators */
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Package, AlertTriangle, CheckCircle, Plus, Minus, ShoppingCart } from "lucide-react";

interface Product {
  id: string;
  name: string;
  brand: string;
  type: string;
  coverage: string;
  weight: string;
  npk: string;
  image: string;
  inStock: boolean;
  quantity: number;
  notes: string;
  bestTime: string;
  oversprayRisk: string;
}

interface ProductInventoryProps {
  products: Product[];
}

const OVERSPRAY_CONFIG = {
  LOW: { color: "text-green-400", bg: "glass-green", border: "border-green-400/30" },
  HIGH: { color: "text-yellow-400", bg: "glass-gold", border: "border-yellow-400/30" },
  CRITICAL: { color: "text-red-400", bg: "glass-red", border: "border-red-400/30" },
};

export default function ProductInventory({ products }: ProductInventoryProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(products.map(p => [p.id, p.quantity]))
  );
  const [selected, setSelected] = useState<string | null>("scotts-weed-feed");

  const adjust = (id: string, delta: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) }));
    if (delta > 0) toast.success("📦 Quantity updated");
  };

  const reorder = (name: string) => {
    toast.success(`🛒 Reorder queued: ${name}`, { description: "Will be added to next supply run" });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-yellow-400" />
          <h3 className="text-sm font-semibold text-white">Product Inventory</h3>
        </div>
        <div className="glass rounded-lg px-2 py-1">
          <span className="text-[10px] text-white/50">{products.filter(p => quantities[p.id] > 0).length} in stock</span>
        </div>
      </div>

      {/* Product cards */}
      <div className="space-y-3">
        {products.map((product, i) => {
          const qty = quantities[product.id] ?? 0;
          const inStock = qty > 0;
          const overspray = OVERSPRAY_CONFIG[product.oversprayRisk as keyof typeof OVERSPRAY_CONFIG] || OVERSPRAY_CONFIG.LOW;
          const isSelected = selected === product.id;

          return (
            <motion.div
              key={product.id}
              className={`glass rounded-xl overflow-hidden border ${isSelected ? "border-yellow-400/30" : "border-white/10"}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div 
                className="flex gap-3 p-3 cursor-pointer"
                onClick={() => setSelected(isSelected ? null : product.id)}
              >
                {/* Product image */}
                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-white/5">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <p className="text-xs font-semibold text-white leading-tight">{product.name}</p>
                      <p className="text-[10px] text-white/50">{product.brand} · {product.type}</p>
                    </div>
                    <div className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 ${inStock ? "glass-green" : "glass-red"}`}>
                      {inStock ? <CheckCircle size={9} className="text-green-400" /> : <AlertTriangle size={9} className="text-red-400" />}
                      <span className={`text-[9px] font-bold ${inStock ? "text-green-400" : "text-red-400"}`}>
                        {inStock ? `${qty}x` : "OUT"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-1 glass rounded-lg">
                      <button onClick={(e) => { e.stopPropagation(); adjust(product.id, -1); }} className="p-1 text-white/50 hover:text-white/90 transition-all">
                        <Minus size={10} />
                      </button>
                      <span className="text-[10px] font-mono text-white w-4 text-center">{qty}</span>
                      <button onClick={(e) => { e.stopPropagation(); adjust(product.id, 1); }} className="p-1 text-white/50 hover:text-white/90 transition-all">
                        <Plus size={10} />
                      </button>
                    </div>

                    {/* Overspray risk */}
                    <div className={`flex items-center gap-1 rounded-full px-1.5 py-0.5 border ${overspray.bg} ${overspray.border}`}>
                      <span className={`text-[9px] font-bold ${overspray.color}`}>
                        ⚠️ {product.oversprayRisk}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {isSelected && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="overflow-hidden border-t border-white/10"
                >
                  <div className="p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="glass rounded-lg p-2">
                        <p className="text-[9px] text-white/40">Coverage</p>
                        <p className="text-[10px] text-white font-medium">{product.coverage}</p>
                      </div>
                      <div className="glass rounded-lg p-2">
                        <p className="text-[9px] text-white/40">NPK Ratio</p>
                        <p className="text-[10px] text-white font-medium">{product.npk}</p>
                      </div>
                    </div>

                    <div className="glass rounded-lg p-2">
                      <p className="text-[9px] text-white/40 mb-0.5">Best Application Time</p>
                      <p className="text-[10px] text-yellow-300">{product.bestTime}</p>
                    </div>

                    <div className="glass rounded-lg p-2">
                      <p className="text-[9px] text-white/40 mb-0.5">Notes</p>
                      <p className="text-[10px] text-white/70 leading-relaxed">{product.notes}</p>
                    </div>

                    {!inStock && (
                      <button
                        onClick={() => reorder(product.name)}
                        className="w-full glass-gold rounded-lg py-2 text-[10px] font-semibold text-yellow-300 border border-yellow-400/30 flex items-center justify-center gap-1.5"
                      >
                        <ShoppingCart size={11} />
                        Reorder {product.name}
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Chip's product wisdom */}
      <div className="glass-gold rounded-xl p-3">
        <p className="text-[11px] text-yellow-300 italic">
          💬 "Scotts Weed & Feed is basically my coffee. Can't start the day without it."
        </p>
        <p className="text-[10px] text-white/40 mt-1">— Chip McHaymaker, Product Enthusiast</p>
      </div>
    </div>
  );
}
