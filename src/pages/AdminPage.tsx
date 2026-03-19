import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface ProductRow {
  id: string;
  name: string;
}

interface BookingSlot {
  product_id: string;
  start_date: string;
  end_date: string;
}

export default function AdminPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [bookings, setBookings] = useState<BookingSlot[]>([]);
  const [revenue, setRevenue] = useState<{ month: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const DAYS = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  useEffect(() => {
    async function load() {
      const startRange = DAYS[0].toISOString().split("T")[0];
      const endRange = DAYS[DAYS.length - 1].toISOString().split("T")[0];

      const [prodRes, bookRes, revRes] = await Promise.all([
        supabase.from("products").select("id, name"),
        supabase.from("bookings").select("product_id, start_date, end_date")
          .eq("status", "confirmed")
          .lte("start_date", endRange)
          .gte("end_date", startRange),
        supabase.from("bookings").select("total_price, created_at").eq("status", "confirmed"),
      ]);

      setProducts(prodRes.data ?? []);
      setBookings(bookRes.data ?? []);

      // Group revenue by month
      const monthMap: Record<string, number> = {};
      (revRes.data ?? []).forEach((b) => {
        const m = b.created_at.slice(0, 7); // YYYY-MM
        monthMap[m] = (monthMap[m] || 0) + Number(b.total_price);
      });
      const months = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([m, amount]) => ({
          month: new Date(m + "-01").toLocaleDateString("es", { month: "short" }),
          amount,
        }));
      setRevenue(months);
      setLoading(false);
    }
    load();
  }, []);

  const isBooked = (productId: string, day: Date) => {
    const d = day.toISOString().split("T")[0];
    return bookings.some(
      (b) => b.product_id === productId && b.start_date <= d && b.end_date >= d
    );
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <ScrollReveal>
          <h1 className="text-2xl font-semibold text-foreground">Panel de Administración</h1>
          <p className="text-sm text-muted-foreground mt-1">Calendario de reservas e ingresos.</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="surface-elevated rounded-lg p-4 overflow-x-auto">
            <h2 className="text-sm font-medium text-foreground mb-4">Calendario de Disponibilidad</h2>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="min-w-[800px]">
                <div className="grid gap-px" style={{ gridTemplateColumns: `160px repeat(${DAYS.length}, 1fr)` }}>
                  <div className="p-2 text-[10px] text-muted-foreground uppercase tracking-wider">Equipo</div>
                  {DAYS.map((d, i) => (
                    <div key={i} className="p-1 text-center">
                      <p className="text-[10px] text-muted-foreground">{d.toLocaleDateString("es", { weekday: "short" })}</p>
                      <p className="text-xs font-mono text-foreground">{d.getDate()}</p>
                    </div>
                  ))}
                </div>
                {products.map((eq) => (
                  <div key={eq.id} className="grid gap-px border-t border-border/50" style={{ gridTemplateColumns: `160px repeat(${DAYS.length}, 1fr)` }}>
                    <div className="p-2 text-xs text-foreground truncate">{eq.name}</div>
                    {DAYS.map((day, i) => {
                      const booked = isBooked(eq.id, day);
                      return (
                        <div
                          key={i}
                          className={`h-8 m-0.5 rounded-sm transition-colors ${
                            booked ? "bg-primary/30 border border-primary/40" : "bg-muted/30 hover:bg-muted/50"
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="surface-elevated rounded-lg p-4">
            <h2 className="text-sm font-medium text-foreground mb-4">Resumen de Ingresos</h2>
            {loading ? (
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : revenue.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Sin ingresos registrados.</p>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {revenue.map((r) => (
                  <div key={r.month} className="text-center p-4 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground uppercase">{r.month} 2026</p>
                    <p className="text-xl font-mono font-semibold text-foreground mt-1">€{r.amount.toFixed(0)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </AppLayout>
  );
}
