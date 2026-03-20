import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, eachDayOfInterval, isWithinInterval, isBefore, startOfDay } from "date-fns";
import { CalendarIcon, Shield, Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Product } from "@/components/ProductCard";

interface CheckoutDialogProps {
  product: Product;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const stepVariants = {
  enter: { opacity: 0, x: 30 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -30 },
};

interface BookedRange {
  start: Date;
  end: Date;
}

export function CheckoutDialog({ product, open, onClose, onSuccess }: CheckoutDialogProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [insurance, setInsurance] = useState(false);
  const [signing, setSigning] = useState(false);
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const hasDrawnRef = useRef(false);

  const days =
    startDate && endDate
      ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;
  const insuranceRate = 0.15;
  const basePrice = days * product.price_per_day;
  const totalPrice = insurance ? basePrice * (1 + insuranceRate) : basePrice;

  // Load booked dates for this product
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingDates(true);

    (async () => {
      const { data } = await supabase
        .from("bookings")
        .select("start_date, end_date")
        .eq("product_id", product.id)
        .eq("status", "confirmed");

      if (!cancelled) {
        const ranges: BookedRange[] = (data ?? []).map((b) => ({
          start: new Date(b.start_date),
          end: new Date(b.end_date),
        }));
        setBookedRanges(ranges);
        setLoadingDates(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open, product.id]);

  // Check for duplicate booking by same user
  useEffect(() => {
    if (!startDate || !endDate || !user) { setDuplicateWarning(false); return; }
    let cancelled = false;

    (async () => {
      const sd = format(startDate, "yyyy-MM-dd");
      const ed = format(endDate, "yyyy-MM-dd");
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("product_id", product.id)
        .eq("user_id", user.id)
        .eq("status", "confirmed")
        .lte("start_date", ed)
        .gte("end_date", sd);

      if (!cancelled) setDuplicateWarning((count ?? 0) > 0);
    })();

    return () => { cancelled = true; };
  }, [startDate, endDate, user, product.id]);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setStep(1);
      setStartDate(undefined);
      setEndDate(undefined);
      setInsurance(false);
      setDuplicateWarning(false);
      hasDrawnRef.current = false;
    }
  }, [open]);

  const isDateBooked = useCallback((date: Date) => {
    const d = startOfDay(date);
    return bookedRanges.some((range) => {
      const s = startOfDay(range.start);
      const e = startOfDay(range.end);
      return isWithinInterval(d, { start: s, end: e });
    });
  }, [bookedRanges]);

  const disabledDays = useCallback((date: Date) => {
    if (isBefore(startOfDay(date), startOfDay(new Date()))) return true;
    return isDateBooked(date);
  }, [isDateBooked]);

  const disabledEndDays = useCallback((date: Date) => {
    if (isBefore(startOfDay(date), startOfDay(startDate || new Date()))) return true;
    return isDateBooked(date);
  }, [isDateBooked, startDate]);

  // Check if selected range overlaps booked dates
  const rangeHasConflict = startDate && endDate && bookedRanges.some((range) => {
    const s = startOfDay(range.start);
    const e = startOfDay(range.end);
    const selStart = startOfDay(startDate);
    const selEnd = startOfDay(endDate);
    return selStart <= e && selEnd >= s;
  });

  const canProceed = startDate && endDate && !rangeHasConflict && !duplicateWarning && !loadingDates;

  // Canvas drawing with proper event handling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || step !== 3) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = "hsl(217 91% 60%)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const getPos = (e: MouseEvent | TouchEvent) => {
      const r = canvas.getBoundingClientRect();
      const touch = "touches" in e ? e.touches[0] : e;
      return { x: touch.clientX - r.left, y: touch.clientY - r.top };
    };

    const start = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDrawingRef.current = true;
      hasDrawnRef.current = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };
    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    };
    const stop = (e: Event) => {
      e.preventDefault();
      isDrawingRef.current = false;
    };

    canvas.addEventListener("mousedown", start, { passive: false });
    canvas.addEventListener("mousemove", draw, { passive: false });
    canvas.addEventListener("mouseup", stop, { passive: false });
    canvas.addEventListener("mouseleave", stop, { passive: false });
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stop, { passive: false });

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
    hasDrawnRef.current = false;
  };

  const handleConfirm = async () => {
    if (!user || !startDate || !endDate || !canvasRef.current || !hasDrawnRef.current) {
      if (!hasDrawnRef.current) toast.error("Por favor, firma el contrato antes de confirmar.");
      return;
    }
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
      onSuccess?.();
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
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Dates */}
            {step === 1 && (
              <motion.div key="step1" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.2 }} className="space-y-4">
                <p className="text-sm font-medium text-foreground">1. Selecciona fechas</p>
                {loadingDates && <p className="text-[10px] text-muted-foreground animate-pulse">Cargando disponibilidad...</p>}
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
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(d) => { setStartDate(d); if (endDate && d && d > endDate) setEndDate(undefined); }}
                          disabled={disabledDays}
                          className="p-3 pointer-events-auto"
                          modifiers={{ booked: (date) => isDateBooked(date) }}
                          modifiersClassNames={{ booked: "text-destructive line-through opacity-50" }}
                        />
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
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={disabledEndDays}
                          className="p-3 pointer-events-auto"
                          modifiers={{ booked: (date) => isDateBooked(date) }}
                          modifiersClassNames={{ booked: "text-destructive line-through opacity-50" }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                {days > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {days} día{days > 1 ? "s" : ""} × €{product.price_per_day}/día = <span className="font-mono text-foreground">€{basePrice.toFixed(2)}</span>
                    </p>
                  </div>
                )}
                {rangeHasConflict && (
                  <p className="text-xs text-destructive font-medium">No disponible en estas fechas — hay solapamiento con una reserva existente.</p>
                )}
                {duplicateWarning && (
                  <p className="text-xs text-destructive font-medium">Ya tienes una reserva activa para este producto en estas fechas.</p>
                )}
                <Button className="w-full" disabled={!canProceed} onClick={() => setStep(2)}>
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
                <div className="relative rounded-md overflow-hidden border border-border bg-muted/10" style={{ touchAction: "none" }}>
                  <canvas
                    ref={canvasRef}
                    className="w-full h-32 cursor-crosshair"
                    style={{ touchAction: "none" }}
                  />
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
