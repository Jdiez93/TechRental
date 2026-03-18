import { AppLayout } from "@/components/AppLayout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Download } from "lucide-react";

const MOCK_RENTALS = [
  { id: "R-001", product: "Sony FX6 Cinema Camera", start: "2026-03-15", end: "2026-03-20", status: "active", total: "€900", insurance: true },
  { id: "R-002", product: "Aputure 600d Pro", start: "2026-03-10", end: "2026-03-14", status: "completed", total: "€260", insurance: false },
  { id: "R-003", product: "DJI Mavic 3 Cine", start: "2026-03-22", end: "2026-03-25", status: "upcoming", total: "€450", insurance: true },
];

const statusMap: Record<string, { label: string; className: string }> = {
  active: { label: "Activo", className: "bg-accent/20 text-accent border-accent/30" },
  completed: { label: "Completado", className: "bg-muted text-muted-foreground border-border" },
  upcoming: { label: "Próximo", className: "bg-primary/20 text-primary border-primary/30" },
};

export default function RentalsPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <ScrollReveal>
          <h1 className="text-2xl font-semibold text-foreground">Mis Alquileres</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona tus reservas y descarga contratos.</p>
        </ScrollReveal>

        <div className="space-y-3">
          {MOCK_RENTALS.map((rental, i) => {
            const st = statusMap[rental.status];
            return (
              <ScrollReveal key={rental.id} delay={i * 0.05}>
                <div className="surface-elevated rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{rental.id}</span>
                      <Badge variant="outline" className={`text-[10px] ${st.className}`}>
                        {st.label}
                      </Badge>
                      {rental.insurance && (
                        <Badge variant="outline" className="text-[10px] border-warning/30 text-warning">
                          Asegurado
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground">{rental.product}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {rental.start} → {rental.end}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold text-foreground">{rental.total}</span>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                      <Download className="h-3 w-3" /> Contrato
                    </Button>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
