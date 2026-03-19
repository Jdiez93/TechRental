import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, CalendarDays, TrendingUp, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";

interface Stats {
  totalProducts: number;
  activeRentals: number;
  monthRevenue: number;
  pendingReturns: number;
}

interface Activity {
  id: string;
  product_name: string;
  status: string;
  created_at: string;
  total_price: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const today = new Date().toISOString().split("T")[0];
      const monthStart = new Date();
      monthStart.setDate(1);

      const [productsRes, activeRes, revenueRes, pendingRes, activityRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("id", { count: "exact", head: true })
          .lte("start_date", today).gte("end_date", today).eq("status", "confirmed"),
        supabase.from("bookings").select("total_price")
          .gte("created_at", monthStart.toISOString()).eq("status", "confirmed"),
        supabase.from("bookings").select("id", { count: "exact", head: true })
          .lt("end_date", today).eq("status", "confirmed"),
        supabase.from("bookings").select("id, status, created_at, total_price, products(name)")
          .order("created_at", { ascending: false }).limit(5),
      ]);

      const monthRevenue = (revenueRes.data ?? []).reduce((sum, b) => sum + Number(b.total_price), 0);

      setStats({
        totalProducts: productsRes.count ?? 0,
        activeRentals: activeRes.count ?? 0,
        monthRevenue,
        pendingReturns: pendingRes.count ?? 0,
      });

      setActivity(
        (activityRes.data ?? []).map((b: any) => ({
          id: b.id,
          product_name: b.products?.name ?? "Producto",
          status: b.status,
          created_at: b.created_at,
          total_price: b.total_price,
        }))
      );

      setLoading(false);
    }
    load();
  }, []);

  const statCards = stats
    ? [
        { label: "Equipos Totales", value: String(stats.totalProducts), icon: Package, sub: "en catálogo" },
        { label: "Alquileres Activos", value: String(stats.activeRentals), icon: CalendarDays, sub: "en curso" },
        { label: "Ingresos del Mes", value: `€${stats.monthRevenue.toFixed(0)}`, icon: TrendingUp, sub: format(new Date(), "MMMM yyyy", { locale: es }) },
        { label: "Devoluciones", value: String(stats.pendingReturns), icon: AlertTriangle, sub: "pendientes" },
      ]
    : [];

  return (
    <AppLayout>
      <div className="max-w-6xl space-y-8">
        <ScrollReveal>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Resumen del estado de tu inventario y alquileres.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="surface-elevated rounded-lg p-4 space-y-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))
            : statCards.map((stat, i) => (
                <ScrollReveal key={stat.label} delay={i * 0.05}>
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="surface-elevated rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                      <stat.icon className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                    <p className="text-2xl font-semibold font-mono text-foreground">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground">{stat.sub}</p>
                  </motion.div>
                </ScrollReveal>
              ))}
        </div>

        <ScrollReveal delay={0.2}>
          <div className="surface-elevated rounded-lg p-6">
            <h2 className="text-sm font-medium text-foreground mb-4">Actividad Reciente</h2>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between py-2">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : activity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay actividad reciente.</p>
            ) : (
              <div className="space-y-3">
                {activity.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm text-foreground">
                        {a.status === "confirmed" ? "Reserva confirmada" : a.status}
                      </p>
                      <p className="text-xs text-muted-foreground">{a.product_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-foreground">€{Number(a.total_price).toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {format(new Date(a.created_at), "dd MMM HH:mm", { locale: es })}
                      </p>
                    </div>
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
