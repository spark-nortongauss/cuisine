"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bot, CalendarClock, CheckCircle2, ClipboardCheck, ShoppingCart, Sparkles, Timer, Wine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { useI18n } from "@/components/i18n/i18n-provider";

const workflowIcons = [Sparkles, ClipboardCheck, ShoppingCart, Timer] as const;
const valueIcons = [Wine, Bot, CalendarClock] as const;

export default function LandingPage() {
  const { t } = useI18n();

  const workflow = [
    {
      title: t("landing.workflow.generate.title", "Generate Michelin-style menus"),
      description: t("landing.workflow.generate.description", "Turn a hosting idea into three beautifully structured culinary concepts in minutes."),
    },
    {
      title: t("landing.workflow.approve.title", "Approve and refine with clarity"),
      description: t("landing.workflow.approve.description", "Collect invitee input, align quickly, and select the winning service direction."),
    },
    {
      title: t("landing.workflow.shop.title", "Shop smarter with confidence"),
      description: t("landing.workflow.shop.description", "Get elegant, actionable shopping guidance with clear state tracking from cart to kitchen."),
    },
    {
      title: t("landing.workflow.cook.title", "Cook with chef-style execution"),
      description: t("landing.workflow.cook.description", "Follow polished timelines, techniques, and execution cues designed for flawless service."),
    },
  ];

  const values = [
    {
      title: t("landing.values.premium.title", "Michelin-inspired creativity"),
      description: t("landing.values.premium.description", "Premium menu storytelling that feels cinematic, balanced, and unforgettable."),
    },
    {
      title: t("landing.values.ai.title", "Practical culinary intelligence"),
      description: t("landing.values.ai.description", "AI support that stays useful in real operations, from planning to plating."),
    },
    {
      title: t("landing.values.hosting.title", "Hosting confidence"),
      description: t("landing.values.hosting.description", "Operate like a calm executive chef even on your most important nights."),
    },
  ];

  const faqs = [
    {
      question: t("landing.faq.q1", "Who is Cuisine built for?"),
      answer: t("landing.faq.a1", "Cuisine is designed for home hosts and culinary enthusiasts who want premium dining experiences without operational stress."),
    },
    {
      question: t("landing.faq.q2", "Can I customize menu style and constraints?"),
      answer: t("landing.faq.a2", "Yes. You can tune meal type, service timing, guest preferences, and culinary direction before generating options."),
    },
    {
      question: t("landing.faq.q3", "Does it help beyond menu ideas?"),
      answer: t("landing.faq.a3", "Absolutely. Cuisine guides approvals, shopping actions, and step-by-step cook execution so you can deliver with confidence."),
    },
  ];

  return (
    <div className="space-y-6 pb-16 md:space-y-8">
      <section className="relative overflow-hidden rounded-[2.2rem] border border-accent/35 bg-hero-luxury p-5 text-foreground shadow-luxe md:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(224,197,143,0.25),transparent_35%),radial-gradient(circle_at_88%_18%,rgba(245,240,233,0.16),transparent_40%)]" />
        <div className="relative space-y-7">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-card/15 px-3 py-1 text-xs uppercase tracking-[0.2em]">
              <Sparkles size={13} />
              {t("landing.brand", "Cuisine")}
            </div>
            <div className="flex items-center gap-2">
              <LocaleSwitcher />
              <Button asChild variant="outline" className="border-accent/40 bg-card/15 text-foreground">
                <Link href="/login">{t("landing.nav.login", "Login")}</Link>
              </Button>
            </div>
          </header>

          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div className="space-y-5">
              <Badge variant="accent">{t("landing.hero.badge", "Premium Culinary AI Platform")}</Badge>
              <h1 className="max-w-3xl font-serif text-4xl leading-[1.05] md:text-6xl">
                {t("landing.hero.title", "From idea to extraordinary service, with Michelin-level confidence at every step")}
              </h1>
              <p className="max-w-2xl text-sm text-foreground/85 md:text-base">
                {t("landing.hero.description", "Generate elegant menus, align decisions, shop with precision, and cook with beautifully structured execution plans built for unforgettable hosting.")}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/login">
                    {t("landing.hero.primaryCta", "Start your culinary journey")}
                    <ArrowRight size={14} />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-accent/45 bg-card/10 text-foreground">
                  <Link href="/generate">{t("landing.hero.secondaryCta", "Explore the workflow")}</Link>
                </Button>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="relative rounded-3xl border border-accent/35 bg-card/10 p-4 backdrop-blur md:p-5"
            >
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/35 blur-2xl" />
              <p className="text-xs uppercase tracking-[0.2em] text-foreground/75">{t("landing.story.eyebrow", "From vision to service")}</p>
              <div className="mt-3 space-y-3">
                {workflow.map((step, index) => {
                  const Icon = workflowIcons[index];
                  return (
                    <div key={step.title} className="rounded-2xl border border-accent/25 bg-card/20 p-3">
                      <p className="flex items-center gap-2 text-sm font-semibold"><Icon size={14} />{step.title}</p>
                      <p className="mt-1 text-xs text-foreground/80">{step.description}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {values.map((value, index) => {
          const Icon = valueIcons[index];
          return (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.45 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <Card className="h-full space-y-3 border-primary/20 transition hover:-translate-y-1 hover:shadow-glow">
                <span className="inline-flex rounded-2xl bg-primary/10 p-2 text-primary">
                  <Icon size={16} />
                </span>
                <h2 className="font-serif text-2xl text-card-foreground">{value.title}</h2>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </Card>
            </motion.div>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("landing.features.eyebrow", "Feature Showcase")}</p>
            <h2 className="font-serif text-3xl text-card-foreground">{t("landing.features.title", "Built for premium hosting outcomes")}</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {workflow.map((step, index) => {
              const Icon = workflowIcons[index];
              return (
                <div key={step.title} className="rounded-2xl border border-border/70 bg-card/70 p-4">
                  <p className="mb-1 flex items-center gap-2 font-semibold text-card-foreground"><Icon size={14} className="text-primary" />{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              );
            })}
          </div>
        </Card>

        <Card variant="feature" className="space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("landing.trust.eyebrow", "Trusted Experience")}</p>
          <h2 className="font-serif text-3xl text-card-foreground">{t("landing.trust.title", "Designed for people who care deeply about every detail")}</h2>
          <p className="text-sm text-muted-foreground">{t("landing.trust.description", "Use Cuisine as your private culinary co-pilot for elevated dinners, memorable celebrations, and premium at-home service.")}</p>
          <div className="space-y-2 rounded-2xl border border-border/70 bg-card/75 p-3">
            <p className="text-sm font-semibold text-card-foreground">{t("landing.trust.testimonialTitle", "Social proof placeholder")}</p>
            <p className="text-xs text-muted-foreground">{t("landing.trust.testimonial", "\"This feels like having a chef operations team in my pocket.\"")}</p>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("landing.pricing.eyebrow", "License & Pricing")}</p>
          <h2 className="font-serif text-3xl text-card-foreground">{t("landing.pricing.title", "Choose your premium culinary license")}</h2>
          <p className="text-sm text-muted-foreground">{t("landing.pricing.description", "Unlock full workflow access: menu generation, approval tools, shopping intelligence, and chef-style execution plans.")}</p>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
            <p className="text-sm font-semibold text-card-foreground">{t("landing.pricing.planTitle", "Cuisine Premium")}</p>
            <p className="text-3xl font-serif text-card-foreground">{t("landing.pricing.planPrice", "€29")}<span className="ml-1 text-sm font-sans text-muted-foreground">{t("landing.pricing.planPeriod", "/ month")}</span></p>
            <p className="mt-1 text-xs text-muted-foreground">{t("landing.pricing.planNote", "Placeholder pricing. Update this section with final licensing terms.")}</p>
          </div>
          <Button asChild className="w-full">
            <Link href="/login">
              {t("landing.pricing.cta", "Start with Cuisine Premium")}
              <ArrowRight size={14} />
            </Link>
          </Button>
        </Card>

        <Card className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("landing.faq.eyebrow", "FAQ")}</p>
          <h2 className="font-serif text-3xl text-card-foreground">{t("landing.faq.title", "Everything you need before starting")}</h2>
          <div className="space-y-2">
            {faqs.map((faq) => (
              <details key={faq.question} className="rounded-2xl border border-border/70 bg-card/70 p-3">
                <summary className="cursor-pointer font-medium text-card-foreground">{faq.question}</summary>
                <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </Card>
      </section>

      <footer className="rounded-3xl border border-border/70 bg-card/80 p-4 text-sm text-muted-foreground md:p-5">
        <p>{t("landing.footer.copy", "Cuisine © 2026. Premium culinary planning for extraordinary hosting experiences.")}</p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link href="/login" className="text-primary underline-offset-4 hover:underline">{t("landing.footer.login", "Login")}</Link>
          <Link href="/generate" className="text-primary underline-offset-4 hover:underline">{t("landing.footer.generate", "Generate")}</Link>
          <span>{t("landing.footer.workflow", "Generate · Approve · Shop · Cook")}</span>
        </div>
      </footer>
    </div>
  );
}
