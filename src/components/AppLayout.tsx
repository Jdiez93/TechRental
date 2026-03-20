import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }

    const fetchUnread = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);
      setUnreadCount(count ?? 0);
    };

    fetchUnread();

    // Subscribe to realtime notification changes
    const channel = supabase
      .channel("notifications-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border px-4 shrink-0 backdrop-blur-md bg-background/80">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="ml-auto flex items-center gap-3">
              {user && (
                <button
                  onClick={() => navigate("/notifications")}
                  className="relative text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-destructive flex items-center justify-center">
                      <span className="text-[8px] text-destructive-foreground font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span>
                    </span>
                  )}
                </button>
              )}
              <span className="font-mono text-[10px] text-muted-foreground/50">NEXUS v2.4.1</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
