import { AppLayout } from "@/components/AppLayout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Package, CalendarDays, TrendingUp, AlertTriangle } from "lucide-react";

const stats = [
  { label: "Equipos Totales", value: "124", icon: Package, change: "+3 esta semana" },
  { label: "Alquileres Activos", value: "18", icon: CalendarDays, change: "4 finalizan hoy" },
  { label: "Ingresos del Mes", value: "€12,450", icon: TrendingUp, change: "+12% vs anterior" },
  { label: "Alertas", value: "3", icon: AlertTriangle, change: "2 devoluciones pendientes" },
];

export default function DashboardPage() {
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
          {stats.map((stat, i) => (
            <ScrollReveal key={stat.label} delay={i * 0.05}>
              <div className="surface-elevated rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </span>
                  <stat.icon className="h-4 w-4 text-muted-foreground/50" />
                </div>
                <p className="text-2xl font-semibold font-mono text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.change}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={0.2}>
          <div className="surface-elevated rounded-lg p-6">
            <h2 className="text-sm font-medium text-foreground mb-4">Actividad Reciente</h2>
            <div className="space-y-3">
              {[
                { action: "Reserva confirmada", item: "Sony FX6 Cinema Camera", time: "Hace 12 min", user: "Carlos M." },
                { action: "Devolución registrada", item: "DJI Ronin 4D", time: "Hace 1h", user: "Laura P." },
                { action: "Nuevo equipo añadido", item: "ARRI Signature Prime 35mm", time: "Hace 3h", user: "Admin" },
                { action: "Seguro activado", item: "RED V-Raptor XL", time: "Hace 5h", user: "Miguel A." },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm text-foreground">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.item}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                    <p className="text-[10px] font-mono text-muted-foreground/60">{activity.user}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </AppLayout>
  );
}
