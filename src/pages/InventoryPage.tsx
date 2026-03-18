import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ProductCard, type Product } from "@/components/ProductCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import redVRaptorImg from "@/assets/red-v-raptor.jpg";

const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "Sony FX6 Cinema Camera", category: "Cámaras", price_per_day: 180, stock_total: 4, stock_available: 2, image_url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80" },
  { id: "2", name: "ARRI Signature Prime 35mm", category: "Ópticas", price_per_day: 120, stock_total: 6, stock_available: 4, image_url: "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=600&q=80" },
  { id: "3", name: "DJI Ronin 4D Gimbal", category: "Estabilización", price_per_day: 95, stock_total: 3, stock_available: 0, image_url: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&q=80" },
  { id: "4", name: "RED V-Raptor XL 8K", category: "Cámaras", price_per_day: 350, stock_total: 2, stock_available: 1, image_url: redVRaptorImg },
  { id: "5", name: "Aputure 600d Pro", category: "Iluminación", price_per_day: 65, stock_total: 8, stock_available: 5, image_url: "https://images.unsplash.com/photo-1574717025058-2f8737d2e2b7?w=600&q=80" },
  { id: "6", name: "Sennheiser MKH 416", category: "Audio", price_per_day: 35, stock_total: 10, stock_available: 7, image_url: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&q=80" },
  { id: "7", name: "Blackmagic ATEM Mini Pro", category: "Switchers", price_per_day: 55, stock_total: 5, stock_available: 3, image_url: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?w=600&q=80" },
  { id: "8", name: "DJI Mavic 3 Cine", category: "Drones", price_per_day: 150, stock_total: 3, stock_available: 2, image_url: "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&q=80" },
];

export default function InventoryPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="max-w-6xl space-y-6">
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Inventario</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {MOCK_PRODUCTS.length} equipos · {MOCK_PRODUCTS.filter(p => p.stock_available > 0).length} disponibles
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar equipos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card border-border text-sm"
              />
            </div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No se encontraron equipos.
          </div>
        )}
      </div>
    </AppLayout>
  );
}
