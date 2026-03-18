import { AppLayout } from "@/components/AppLayout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Badge } from "@/components/ui/badge";

const EQUIPMENT = [
  "Sony FX6", "ARRI Prime 35mm", "DJI Ronin 4D", "RED V-Raptor", "Aputure 600d",
  "Sennheiser 416", "ATEM Mini Pro", "DJI Mavic 3"
];

const DAYS = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return d;
});

// Simulate some bookings
const bookings: Record<string, number[]> = {
  "Sony FX6": [0, 1, 2, 3, 4],
  "RED V-Raptor": [2, 3, 4, 5, 6, 7],
  "Aputure 600d": [5, 6, 7],
  "DJI Mavic 3": [1, 2, 8, 9, 10],
};

const REVENUE = [
  { month: "Ene", amount: "€8,200" },
  { month: "Feb", amount: "€10,750" },
  { month: "Mar", amount: "€12,450" },
];

export default function AdminPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <ScrollReveal>
          <h1 className="text-2xl font-semibold text-foreground">Panel de Administración</h1>
          <p className="text-sm text-muted-foreground mt-1">Calendario de reservas e ingresos.</p>
        </ScrollReveal>

        {/* Gantt-style calendar */}
        <ScrollReveal delay={0.1}>
          <div className="surface-elevated rounded-lg p-4 overflow-x-auto">
            <h2 className="text-sm font-medium text-foreground mb-4">Calendario de Disponibilidad</h2>
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid gap-px" style={{ gridTemplateColumns: `160px repeat(${DAYS.length}, 1fr)` }}>
                <div className="p-2 text-[10px] text-muted-foreground uppercase tracking-wider">Equipo</div>
                {DAYS.map((d, i) => (
                  <div key={i} className="p-1 text-center">
                    <p className="text-[10px] text-muted-foreground">{d.toLocaleDateString("es", { weekday: "short" })}</p>
                    <p className="text-xs font-mono text-foreground">{d.getDate()}</p>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {EQUIPMENT.map((eq) => (
                <div
                  key={eq}
                  className="grid gap-px border-t border-border/50"
                  style={{ gridTemplateColumns: `160px repeat(${DAYS.length}, 1fr)` }}
                >
                  <div className="p-2 text-xs text-foreground truncate">{eq}</div>
                  {DAYS.map((_, i) => {
                    const booked = bookings[eq]?.includes(i);
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
          </div>
        </ScrollReveal>

        {/* Revenue */}
        <ScrollReveal delay={0.2}>
          <div className="surface-elevated rounded-lg p-4">
            <h2 className="text-sm font-medium text-foreground mb-4">Resumen de Ingresos</h2>
            <div className="grid grid-cols-3 gap-4">
              {REVENUE.map((r) => (
                <div key={r.month} className="text-center p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase">{r.month} 2026</p>
                  <p className="text-xl font-mono font-semibold text-foreground mt-1">{r.amount}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </AppLayout>
  );
}
