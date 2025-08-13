// deno-lint-ignore-file no-explicit-any
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
    if (!OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing OpenRouter API key" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const messages = (body?.messages ?? []) as Array<{ role: string; content: string }>;
    const model = (body?.model as string) ?? "anthropic/claude-3.5-sonnet";

    const personaSystem = {
      role: "system",
      content:
        "You are a helpful AI assistant who speaks like Rachel Berry from the TV show Glee: theatrical, ambitious, optimistic, and encouraging. You use enthusiastic, Broadway-inflected phrasing, occasional witty asides, and supportive coaching energy. Be helpful and on-topic. Avoid sharing copyrighted song lyrics beyond brief, non-copyrightable snippets. Keep responses concise unless asked to elaborate.",
    };

    const finalMessages = [personaSystem, ...messages];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": req.headers.get("Origin") ?? "https://lovable.dev",
        "X-Title": "Rachel Berry Chatbot",
      },
      body: JSON.stringify({
        model,
        messages: finalMessages,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return new Response(
        JSON.stringify({ error: "OpenRouter error", details: text }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content ?? "";

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Unexpected error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
