import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { ScrollReveal } from "@/components/ScrollReveal";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Check, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setNotifications(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (error) {
      // Revert on failure
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppLayout>
      <div className="max-w-3xl space-y-6">
        <ScrollReveal>
          <h1 className="text-2xl font-semibold text-foreground">Notificaciones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Cargando..." : `${unreadCount} sin leer`}
          </p>
        </ScrollReveal>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="surface-elevated rounded-lg p-4 flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-64" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : !user ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Inicia sesión para ver tus notificaciones.</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Inbox className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No tienes notificaciones.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {notifications.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 300, damping: 24 }}
                  className={`surface-elevated rounded-lg p-4 flex gap-3 ${!n.read ? "border-primary/20" : ""}`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${!n.read ? "bg-primary/10" : "bg-muted"}`}>
                    {n.read ? <Check className="h-3.5 w-3.5 text-muted-foreground" /> : <Bell className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/50 mt-1 font-mono">
                      {format(new Date(n.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                    </p>
                  </div>
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] text-muted-foreground shrink-0"
                      onClick={() => markAsRead(n.id)}
                    >
                      Marcar leída
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
