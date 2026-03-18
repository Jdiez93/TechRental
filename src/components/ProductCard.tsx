import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";
import { CheckoutDialog } from "@/components/CheckoutDialog";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export interface Product {
  id: string;
  name: string;
  category: string;
  price_per_day: number;
  stock_total: number;
  stock_available: number;
  image_url: string;
}

export function ProductCard({ product, index }: { product: Product; index: number }) {
  const inStock = product.stock_available > 0;
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleRent = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setCheckoutOpen(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.02, ease: "easeOut" }}
        className="group surface-elevated rounded-lg overflow-hidden hover:border-primary/30 transition-colors duration-200"
      >
        <div className="aspect-[4/3] bg-secondary/50 relative overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
            loading="lazy"
          />
          <Badge
            variant={inStock ? "default" : "destructive"}
            className={`absolute top-2 right-2 text-[10px] font-mono ${
              inStock ? "bg-accent text-accent-foreground" : ""
            }`}
          >
            {inStock ? `${product.stock_available} disp.` : "Agotado"}
          </Badge>
        </div>
        <div className="p-4 space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {product.category}
          </p>
          <h3 className="text-sm font-medium text-foreground leading-tight">
            {product.name}
          </h3>
          <div className="flex items-center justify-between pt-1">
            <span className="font-mono text-sm text-primary font-semibold">
              €{product.price_per_day}<span className="text-muted-foreground font-normal text-xs">/día</span>
            </span>
            <Button
              size="sm"
              disabled={!inStock}
              onClick={handleRent}
              className="h-7 text-xs px-3 transition-all duration-150"
            >
              Alquilar
            </Button>
          </div>
        </div>
      </motion.div>
      <CheckoutDialog product={product} open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
    </>
  );
}
