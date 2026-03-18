import { AppLayout } from "@/components/AppLayout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const MOCK_NOTIFICATIONS = [
  { id: 1, title: "Reserva confirmada", message: "Tu reserva de Sony FX6 ha sido confirmada para el 15-20 Mar.", time: "Hace 12 min", read: false },
  { id: 2, title: "Devolución pendiente", message: "Recuerda devolver el Aputure 600d Pro mañana antes de las 10:00.", time: "Hace 2h", read: false },
  { id: 3, title: "Nuevo equipo disponible", message: "RED V-Raptor XL 8K está de nuevo disponible para alquiler.", time: "Hace 1 día", read: true },
  { id: 4, title: "Factura generada", message: "La factura #INV-2026-042 está lista para descargar.", time: "Hace 3 días", read: true },
];

export default function NotificationsPage() {
  return (
    <AppLayout>
      <div className="max-w-3xl space-y-6">
        <ScrollReveal>
          <h1 className="text-2xl font-semibold text-foreground">Notificaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">{MOCK_NOTIFICATIONS.filter(n => !n.read).length} sin leer</p>
        </ScrollReveal>

        <div className="space-y-2">
          {MOCK_NOTIFICATIONS.map((n, i) => (
            <ScrollReveal key={n.id} delay={i * 0.04}>
              <div className={`surface-elevated rounded-lg p-4 flex gap-3 ${!n.read ? "border-primary/20" : ""}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${!n.read ? "bg-primary/10" : "bg-muted"}`}>
                  {n.read ? <Check className="h-3.5 w-3.5 text-muted-foreground" /> : <Bell className="h-3.5 w-3.5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono">{n.time}</p>
                </div>
                {!n.read && (
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] text-muted-foreground shrink-0">
                    Marcar leída
                  </Button>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
