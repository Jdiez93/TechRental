import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Sesión iniciada correctamente");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        });
        if (error) throw error;
        toast.success("Cuenta creada correctamente");
        navigate("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Brand */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">N</span>
          </div>
          <span className="text-2xl font-semibold tracking-tight text-foreground">
            Nexus<span className="text-muted-foreground font-light"> Rental</span>
          </span>
        </div>

        <div className="surface-elevated rounded-lg p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-lg font-semibold text-foreground">
              {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {isLogin ? "Accede a tu panel de alquileres" : "Regístrate para empezar a alquilar"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nombre</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Tu nombre"
                  className="bg-background border-border"
                  required
                />
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="bg-background border-border"
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Contraseña</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background border-border"
                minLength={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Cargando..." : isLogin ? "Entrar" : "Crear Cuenta"}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
            </button>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground/40 text-center mt-6 font-mono">
          NEXUS RENTAL v2.4.1 — Plataforma segura
        </p>
      </motion.div>
    </div>
  );
}
