import { useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";


type Message = {
  role: "user" | "assistant";
  content: string;
};

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I’m your starry-eyed study buddy with a Broadway heart. What should we rehearse today—ideas, plans, or a big dream?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = messages
        .concat(userMessage)
        .map((m) => ({ role: m.role, content: m.content }));

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rachel-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!resp.ok) {
        throw new Error(await resp.text());
      }

      const data = await resp.json();
      const assistantText: string = data?.content ?? "";
      setMessages((m) => [...m, { role: "assistant", content: assistantText }]);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Couldn’t reach the star",
        description:
          "I couldn’t connect to the chat service. Make sure the OpenRouter API key is set and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      sendMessage();
    }
  };

  const canonical = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      <Helmet>
        <title>Rachel Berry Style Chatbot | OpenRouter Secure Proxy</title>
        <meta
          name="description"
          content="Chat with a Rachel Berry-inspired assistant. Securely proxied via Supabase Edge Functions using your OpenRouter API key."
        />
        {canonical && <link rel="canonical" href={canonical} />}
      </Helmet>

      <div className="min-h-screen relative">
        <div className="absolute inset-0 -z-10 aura" aria-hidden="true" />
        <header className="container py-10">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Rachel Berry Chatbot
            </h1>
            <p className="text-muted-foreground text-lg">
              Talk to an upbeat, theatrical assistant. Your API key stays safe—requests are securely proxied through Supabase.
            </p>
          </div>
        </header>

        <main className="container pb-16">
          <section aria-label="Chat" className="mx-auto max-w-3xl">
            <Card className="p-0 overflow-hidden border">
              <ScrollArea className="h-[52vh] md:h-[60vh] p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((m, idx) => (
                    <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed shadow-sm transition-colors ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                        aria-live={m.role === "assistant" ? "polite" : undefined}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t p-3 md:p-4">
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Ask away — press ⌘/Ctrl+Enter to send"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    aria-label="Your message"
                  />
                  <Button
                    variant="hero"
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    aria-label="Send message"
                  >
                    <Send className="opacity-90" />
                    {loading ? "Sending..." : "Send"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Tip: This persona channels Rachel Berry’s tone. No copyrighted lyrics will be reproduced.
                </p>
              </div>
            </Card>
          </section>
        </main>
      </div>
    </>
  );
};

export default Index;
