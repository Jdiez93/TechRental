import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

interface Rental {
  id: string;
  product_name: string;
  start_date: string;
  end_date: string;
  status: string;
  total_price: number;
  insurance_included: boolean;
  signature_base64: string | null;
}

const statusMap: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Activo", className: "bg-accent/20 text-accent border-accent/30" },
  completed: { label: "Completado", className: "bg-muted text-muted-foreground border-border" },
  cancelled: { label: "Cancelado", className: "bg-destructive/20 text-destructive border-destructive/30" },
};

function downloadContract(rental: Rental) {
  const win = window.open("", "_blank");
  if (!win) return;

  win.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Contrato - ${rental.id.slice(0, 8)}</title>
      <style>
        body { font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; color: #1a1a1a; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .subtitle { color: #666; font-size: 12px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        td { padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; }
        td:first-child { color: #666; }
        td:last-child { text-align: right; font-weight: 500; }
        .signature { margin-top: 24px; }
        .signature img { max-width: 200px; border: 1px solid #ddd; border-radius: 4px; }
        .total { font-size: 18px; font-weight: 600; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <h1>Contrato de Alquiler</h1>
      <p class="subtitle">Nexus Rental · Ref: ${rental.id.slice(0, 8).toUpperCase()}</p>
      <table>
        <tr><td>Equipo</td><td>${rental.product_name}</td></tr>
        <tr><td>Fecha Inicio</td><td>${rental.start_date}</td></tr>
        <tr><td>Fecha Fin</td><td>${rental.end_date}</td></tr>
        <tr><td>Seguro</td><td>${rental.insurance_included ? "Sí (+15%)" : "No"}</td></tr>
        <tr><td>Total</td><td class="total">€${rental.total_price.toFixed(2)}</td></tr>
      </table>
      ${rental.signature_base64 ? `<div class="signature"><p style="font-size:12px;color:#666">Firma digital:</p><img src="${rental.signature_base64}" /></div>` : ""}
      <p style="margin-top:32px;font-size:10px;color:#999;">Documento generado automáticamente por Nexus Rental.</p>
      <script>window.print();</script>
    </body>
    </html>
  `);
  win.document.close();
}

export default function RentalsPage() {
  const { user } = useAuth();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    async function load() {
      const { data } = await supabase
        .from("bookings")
        .select("id, start_date, end_date, status, total_price, insurance_included, signature_base64, products(name)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      setRentals(
        (data ?? []).map((b: any) => ({
          id: b.id,
          product_name: b.products?.name ?? "Producto",
          start_date: b.start_date,
          end_date: b.end_date,
          status: b.status,
          total_price: Number(b.total_price),
          insurance_included: b.insurance_included,
          signature_base64: b.signature_base64,
        }))
      );
      setLoading(false);
    }
    load();
  }, [user]);

  return (
    <AppLayout>
      <div className="max-w-4xl space-y-6">
        <ScrollReveal>
          <h1 className="text-2xl font-semibold text-foreground">Mis Alquileres</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona tus reservas y descarga contratos.</p>
        </ScrollReveal>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="surface-elevated rounded-lg p-4 flex gap-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-7 w-24" />
              </div>
            ))}
          </div>
        ) : !user ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Inicia sesión para ver tus alquileres.</div>
        ) : rentals.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No tienes alquileres todavía.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rentals.map((rental, i) => {
              const st = statusMap[rental.status] ?? statusMap.confirmed;
              return (
                <ScrollReveal key={rental.id} delay={i * 0.05}>
                  <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="surface-elevated rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-muted-foreground">{rental.id.slice(0, 8).toUpperCase()}</span>
                        <Badge variant="outline" className={`text-[10px] ${st.className}`}>{st.label}</Badge>
                        {rental.insurance_included && (
                          <Badge variant="outline" className="text-[10px] border-warning/30 text-warning">Asegurado</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground">{rental.product_name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        {rental.start_date} → {rental.end_date}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-semibold text-foreground">€{rental.total_price.toFixed(2)}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => downloadContract(rental)}
                      >
                        <Download className="h-3 w-3" /> Contrato
                      </Button>
                    </div>
                  </motion.div>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
