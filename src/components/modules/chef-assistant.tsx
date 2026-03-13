"use client";

import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MessageCircle, SendHorizontal, Sparkles, Trash2, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type PageContext = {
  pageType: "global" | "generate" | "approval" | "shopping" | "cook";
  menuId?: string;
};

function inferContext(pathname: string | null): PageContext {
  if (!pathname) return { pageType: "global" };

  const cookMatch = pathname.match(/^\/cook\/([^/]+)/);
  if (cookMatch) return { pageType: "cook", menuId: cookMatch[1] };

  const shoppingMatch = pathname.match(/^\/shopping\/([^/]+)/);
  if (shoppingMatch) return { pageType: "shopping", menuId: shoppingMatch[1] };

  const approvalMatch = pathname.match(/^\/approval\/menus\/([^/]+)/);
  if (approvalMatch) return { pageType: "approval", menuId: approvalMatch[1] };

  if (pathname.startsWith("/generate")) return { pageType: "generate" };

  return { pageType: "global" };
}

function contextLabel(context: PageContext, t: (key: string, fallback?: string) => string) {
  if (context.pageType === "cook") return t("chefAssistant.context.cook", "Using Cook Plan context");
  if (context.pageType === "shopping") return t("chefAssistant.context.shopping", "Using Shopping List context");
  if (context.pageType === "approval") return t("chefAssistant.context.approval", "Using Menu context");
  if (context.pageType === "generate") return t("chefAssistant.context.generate", "Using Generate workspace context");
  return t("chefAssistant.context.global", "General culinary mode");
}

export function ChefAssistant() {
  const pathname = usePathname();
  const { locale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pageContext = useMemo(() => inferContext(pathname), [pathname]);
  const starterPrompts = [
    t("chefAssistant.starter.timeline", "Explain the current cooking timeline"),
    t("chefAssistant.starter.plating", "How should I plate this dish?"),
    t("chefAssistant.starter.prep", "What can I prepare in advance?"),
    t("chefAssistant.starter.substitution", "Suggest a substitution"),
  ];

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || isLoading) return;

    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chef-assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          locale,
          pageType: pageContext.pageType,
          menuId: pageContext.menuId,
          conversation: nextMessages,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { reply?: string; error?: string } | null;

      if (!response.ok || !payload?.reply) {
        setError(payload?.error ?? t("chefAssistant.error", "Could not get a response right now. Please try again."));
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: payload.reply ?? "" }]);
    } catch {
      setError(t("chefAssistant.error", "Could not get a response right now. Please try again."));
    } finally {
      setIsLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={t("chefAssistant.open", "Open AI Chef Assistant")}
        className="fixed bottom-24 right-4 z-[70] inline-flex h-14 w-14 items-center justify-center rounded-full border border-accent/70 bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-luxe transition hover:scale-[1.03] md:bottom-24 md:right-8"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
      >
        <MessageCircle size={20} />
      </motion.button>

      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.button
              type="button"
              className="fixed inset-0 z-[75] bg-black/30 backdrop-blur-[2px]"
              onClick={() => setIsOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label={t("chefAssistant.close", "Close assistant")}
            />
            <motion.aside
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed bottom-24 right-4 z-[80] flex h-[70vh] w-[min(92vw,420px)] flex-col rounded-3xl border border-accent/40 bg-card/95 p-4 shadow-luxe backdrop-blur-xl md:bottom-24 md:right-8"
              dir={locale === "ar" ? "rtl" : "ltr"}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("chefAssistant.badge", "AI Copilot")}</p>
                  <h3 className="font-serif text-xl text-foreground">{t("chefAssistant.title", "AI Chef Assistant")}</h3>
                  <p className="text-xs text-muted-foreground">{t("chefAssistant.helper", "Ask for execution, plating, timing, substitutions, or troubleshooting guidance.")}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label={t("chefAssistant.close", "Close assistant")}>
                  <X size={16} />
                </Button>
              </div>

              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">{contextLabel(pageContext, t)}</span>
                <Button variant="ghost" size="sm" onClick={() => setMessages([])} disabled={!messages.length || isLoading}>
                  <Trash2 size={14} />
                  {t("chefAssistant.clear", "Clear")}
                </Button>
              </div>

              <Card className="flex-1 space-y-3 overflow-y-auto bg-background/50 p-3">
                {!messages.length ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{t("chefAssistant.empty", "Need help with prep, cooking, plating, or service? Try one of these prompts.")}</p>
                    <div className="flex flex-wrap gap-2">
                      {starterPrompts.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => void sendMessage(prompt)}
                          className="rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs text-foreground transition hover:border-primary/50"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={cn("max-w-[90%] rounded-2xl px-3 py-2 text-sm", message.role === "assistant"
                        ? "mr-auto border border-accent/30 bg-accent-luxury/50 text-foreground"
                        : "ml-auto bg-primary text-primary-foreground")}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                  ))
                )}
                {isLoading ? (
                  <div className="mr-auto inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-3 py-2 text-xs text-muted-foreground">
                    <Loader2 size={14} className="animate-spin" /> {t("chefAssistant.thinking", "Chef assistant is thinking...")}
                  </div>
                ) : null}
              </Card>

              {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}

              <form onSubmit={onSubmit} className="mt-3 flex items-center gap-2">
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={t("chefAssistant.placeholder", "Ask a culinary question...")}
                  className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none ring-primary transition focus:ring-2"
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <SendHorizontal size={16} />}
                </Button>
              </form>
              <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground"><Sparkles size={12} />{t("chefAssistant.disclaimer", "Guidance can be approximate. Always verify food safety and allergens.")}</p>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
