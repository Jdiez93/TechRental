import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Shield, Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Product } from "@/components/ProductCard";

interface CheckoutDialogProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

export function CheckoutDialog({ product, open, onClose }: CheckoutDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [insurance, setInsurance] = useState(false);
  const [signing, setSigning] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checkingAvail, setCheckingAvail] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  const days =
    startDate && endDate
      ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
  const insuranceRate = 0.15;
  const basePrice = days * product.price_per_day;
  const totalPrice = insurance ? basePrice * (1 + insuranceRate) : basePrice;

  // Check availability when dates change
  useEffect(() => {
    if (!startDate || !endDate) { setAvailable(null); return; }
    let cancelled = false;
    setCheckingAvail(true);
    (async () => {
      const sd = format(startDate, "yyyy-MM-dd");
      const ed = format(endDate, "yyyy-MM-dd");
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("product_id", product.id)
        .eq("status", "confirmed")
        .lte("start_date", ed)
        .gte("end_date", sd);
      if (!cancelled) {
        setAvailable((count ?? 0) < product.stock_total);
        setCheckingAvail(false);
      }
    })();
    return () => { cancelled = true; };
  }, [startDate, endDate, product.id, product.stock_total]);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setStep(1);
      setStartDate(undefined);
      setEndDate(undefined);
      setInsurance(false);
      setAvailable(null);
    }
  }, [open]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || step !== 3) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = "hsl(217 91% 60%)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const touch = "touches" in e ? e.touches[0] : e;
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    };

    const start = (e: MouseEvent | TouchEvent) => {
      isDrawingRef.current = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };
    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };
    const stop = () => { isDrawingRef.current = false; };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stop);
    canvas.addEventListener("mouseleave", stop);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stop);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stop);
      canvas.removeEventListener("mouseleave", stop);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stop);
    };
  }, [step]);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleConfirm = async () => {
    if (!user || !startDate || !endDate || !canvasRef.current) return;
    setSigning(true);

    const signatureData = canvasRef.current.toDataURL("image/png");

    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      product_id: product.id,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      insurance_included: insurance,
      total_price: totalPrice,
      signature_base64: signatureData,
      status: "confirmed",
    });

    setSigning(false);
    if (error) {
      toast.error("Error al crear la reserva");
      console.error(error);
    } else {
      toast.success("¡Reserva confirmada!");
      onClose();
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="surface-elevated rounded-lg w-full max-w-md p-6 space-y-5 shadow-2xl shadow-primary/5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Checkout</h2>
              <p className="text-xs text-muted-foreground">{product.name}</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <motion.div
                key={s}
                className={cn("h-1 flex-1 rounded-full transition-colors", s <= step ? "bg-primary" : "bg-secondary")}
                layoutId={`step-${s}`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Dates */}
            {step === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-4">
                <p className="text-sm font-medium text-foreground">1. Selecciona fechas</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Inicio</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-xs mt-1">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {startDate ? format(startDate, "dd/MM/yy") : "Fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} disabled={(d) => d < new Date()} className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Fin</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-xs mt-1">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          {endDate ? format(endDate, "dd/MM/yy") : "Fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} disabled={(d) => d < (startDate || new Date())} className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                {days > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {days} día{days > 1 ? "s" : ""} × €{product.price_per_day}/día = <span className="font-mono text-foreground">€{basePrice.toFixed(2)}</span>
                    </p>
                    {checkingAvail && <p className="text-[10px] text-muted-foreground animate-pulse">Verificando disponibilidad...</p>}
                    {available === false && (
                      <p className="text-xs text-destructive font-medium">No disponible en estas fechas</p>
                    )}
                  </div>
                )}
                <Button className="w-full" disabled={!startDate || !endDate || available === false || checkingAvail} onClick={() => setStep(2)}>
                  {checkingAvail ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Siguiente
                </Button>
              </motion.div>
            )}

            {/* Step 2: Insurance */}
            {step === 2 && (
              <motion.div key="step2" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-4">
                <p className="text-sm font-medium text-foreground">2. Seguro de equipo</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setInsurance(false)}
                    className={cn("surface-elevated rounded-lg p-4 text-left transition-all", !insurance ? "border-primary glow-primary" : "hover:border-muted-foreground/30")}
                  >
                    <p className="text-sm font-medium text-foreground">Sin seguro</p>
                    <p className="text-xs text-muted-foreground mt-1">Riesgo por tu cuenta</p>
                    <p className="font-mono text-sm text-foreground mt-2">€{basePrice.toFixed(2)}</p>
                  </button>
                  <button
                    onClick={() => setInsurance(true)}
                    className={cn("surface-elevated rounded-lg p-4 text-left transition-all", insurance ? "border-primary glow-primary" : "hover:border-muted-foreground/30")}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <Shield className="h-3.5 w-3.5 text-accent" />
                      <p className="text-sm font-medium text-foreground">Con seguro</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Cobertura completa</p>
                    <p className="font-mono text-sm text-foreground mt-2">€{(basePrice * (1 + insuranceRate)).toFixed(2)}</p>
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Atrás</Button>
                  <Button onClick={() => setStep(3)} className="flex-1">Siguiente</Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Signature */}
            {step === 3 && (
              <motion.div key="step3" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-4">
                <p className="text-sm font-medium text-foreground">3. Firma digital</p>
                <p className="text-xs text-muted-foreground">Firma en el recuadro para aceptar el contrato de alquiler.</p>
                <div className="relative rounded-md overflow-hidden border border-border bg-muted/10">
                  <canvas ref={canvasRef} className="w-full h-32 cursor-crosshair touch-none" />
                  <button
                    onClick={clearSignature}
                    className="absolute top-2 right-2 text-[10px] text-muted-foreground hover:text-foreground bg-card/80 rounded px-2 py-0.5 backdrop-blur-sm"
                  >
                    Limpiar
                  </button>
                </div>
                <div className="surface-elevated rounded-md p-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Equipo</span>
                    <span className="text-foreground">{product.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Días</span>
                    <span className="text-foreground">{days}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Seguro</span>
                    <span className="text-foreground">{insurance ? "Sí (+15%)" : "No"}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium pt-1 border-t border-border">
                    <span className="text-foreground">Total</span>
                    <span className="font-mono text-primary">€{totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Atrás</Button>
                  <Button onClick={handleConfirm} disabled={signing} className="flex-1 gap-1">
                    {signing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    {signing ? "Procesando..." : "Confirmar"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
