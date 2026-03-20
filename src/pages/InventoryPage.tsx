import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ProductCard, type Product } from "@/components/ProductCard";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import redVRaptorImg from "@/assets/red-v-raptor.jpg";

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];

    const [productsRes, bookingsRes] = await Promise.all([
      supabase.from("products").select("*"),
      supabase.from("bookings").select("product_id").lte("start_date", today).gte("end_date", today).eq("status", "confirmed"),
    ]);

    const activeBookings = bookingsRes.data ?? [];
    const bookingCount: Record<string, number> = {};
    activeBookings.forEach((b) => {
      bookingCount[b.product_id] = (bookingCount[b.product_id] || 0) + 1;
    });

    const mapped: Product[] = (productsRes.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price_per_day: Number(p.price_per_day),
      stock_total: p.stock_total,
      stock_available: p.stock_total - (bookingCount[p.id] || 0),
      image_url: p.image_url || redVRaptorImg,
    }));

    setProducts(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filtered = products.filter(
    (p) =>
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
                {loading ? "Cargando..." : `${products.length} equipos · ${products.filter((p) => p.stock_available > 0).length} disponibles`}
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

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="surface-elevated rounded-lg overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-32" />
                  <div className="flex justify-between pt-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-7 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} onBookingComplete={loadProducts} />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No se encontraron equipos.
          </div>
        )}
      </div>
    </AppLayout>
  );
}
