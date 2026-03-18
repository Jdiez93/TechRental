import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CATALOG = `
Catálogo de Nexus Rental - Equipamiento técnico profesional:
- Sony FX6 Cinema Camera (€180/día) - Cámara de cine full-frame, ideal para producciones cinematográficas
- ARRI Signature Prime 35mm (€120/día) - Óptica premium para cine de alta gama
- DJI Ronin 4D Gimbal (€95/día) - Estabilizador profesional para cámaras de cine
- RED V-Raptor XL 8K (€350/día) - Cámara 8K de gama alta para producciones premium
- Aputure 600d Pro (€65/día) - Iluminación LED profesional de alta potencia
- Sennheiser MKH 416 (€35/día) - Micrófono direccional estándar de la industria
- Blackmagic ATEM Mini Pro (€55/día) - Switcher de producción en vivo
- DJI Mavic 3 Cine (€150/día) - Dron con cámara Hasselblad 4/3 CMOS

Puedes sugerir "Smart Bundles" para eventos:
- Bundle Producción Completa: Sony FX6 + ARRI Prime + Aputure 600d + Sennheiser 416 = €400/día (ahorro 10%)
- Bundle Documental: Sony FX6 + DJI Ronin 4D + Sennheiser 416 = €310/día (ahorro 8%)
- Bundle Aéreo Pro: DJI Mavic 3 + Aputure 600d = €215/día (ahorro 5%)
- Bundle Streaming: ATEM Mini Pro + Aputure 600d + Sennheiser 416 = €155/día (ahorro 10%)
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Eres el asistente IA de Nexus Rental, una plataforma premium de alquiler de equipamiento técnico audiovisual. Responde siempre en español. Sé conciso y profesional. Si el usuario describe un evento o proyecto, sugiere Smart Bundles relevantes del catálogo. Si preguntan por disponibilidad, di que pueden consultarlo en el inventario. Mantén respuestas cortas (máximo 3-4 oraciones).\n\n${CATALOG}`,
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes, intenta de nuevo." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del servicio IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
