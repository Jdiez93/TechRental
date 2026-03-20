import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, CalendarDays, TrendingUp, AlertTriangle, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";

interface AdminStats {
  totalProducts: number;
  activeRentals: number;
  monthRevenue: number;
  pendingReturns: number;
}

interface CustomerStats {
  monthlySpend: number;
  totalRentals: number;
  activeRentals: number;
  totalProducts: number;
}

interface Activity {
  id: string;
  product_name: string;
  status: string;
  created_at: string;
  total_price: number;
}

export default function DashboardPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (authLoading) return;
    setLoading(true);

    const today = new Date().toISOString().split("T")[0];
    const monthStart = new Date();
    monthStart.setDate(1);

    if (isAdmin && user) {
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
      setAdminStats({
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
    } else if (user) {
      const [productsRes, spendRes, totalRes, activeRes, activityRes] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("total_price")
          .eq("user_id", user.id).gte("created_at", monthStart.toISOString()).eq("status", "confirmed"),
        supabase.from("bookings").select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase.from("bookings").select("id", { count: "exact", head: true })
          .eq("user_id", user.id).lte("start_date", today).gte("end_date", today).eq("status", "confirmed"),
        supabase.from("bookings").select("id, status, created_at, total_price, products(name)")
          .eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);

      const monthlySpend = (spendRes.data ?? []).reduce((sum, b) => sum + Number(b.total_price), 0);
      setCustomerStats({
        monthlySpend,
        totalRentals: totalRes.count ?? 0,
        activeRentals: activeRes.count ?? 0,
        totalProducts: productsRes.count ?? 0,
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
    } else {
      // Not logged in — show basic product count
      const { count } = await supabase.from("products").select("id", { count: "exact", head: true });
      setCustomerStats({ monthlySpend: 0, totalRentals: 0, activeRentals: 0, totalProducts: count ?? 0 });
    }

    setLoading(false);
  }, [user, isAdmin, authLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statCards = isAdmin && adminStats
    ? [
        { label: "Equipos Totales", value: String(adminStats.totalProducts), icon: Package, sub: "en catálogo" },
        { label: "Alquileres Activos", value: String(adminStats.activeRentals), icon: CalendarDays, sub: "en curso" },
        { label: "Ingresos del Mes", value: `€${adminStats.monthRevenue.toFixed(0)}`, icon: TrendingUp, sub: format(new Date(), "MMMM yyyy", { locale: es }) },
        { label: "Devoluciones", value: String(adminStats.pendingReturns), icon: AlertTriangle, sub: "pendientes" },
      ]
    : customerStats
    ? [
        { label: "Equipos Disponibles", value: String(customerStats.totalProducts), icon: Package, sub: "en catálogo" },
        { label: "Alquileres Activos", value: String(customerStats.activeRentals), icon: CalendarDays, sub: "en curso" },
        { label: "Gasto Mensual", value: `€${customerStats.monthlySpend.toFixed(0)}`, icon: Wallet, sub: format(new Date(), "MMMM yyyy", { locale: es }) },
        { label: "Alquileres Totales", value: String(customerStats.totalRentals), icon: TrendingUp, sub: "históricos" },
      ]
    : [];

  return (
    <AppLayout>
      <div className="max-w-6xl space-y-8">
        <ScrollReveal>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin ? "Resumen global de la plataforma." : "Resumen de tu actividad de alquiler."}
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
              <p className="text-sm text-muted-foreground py-4 text-center">
                {user ? "No hay actividad reciente." : "Inicia sesión para ver tu actividad."}
              </p>
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
