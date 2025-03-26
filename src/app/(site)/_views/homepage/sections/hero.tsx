import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, TrendingUp, Lightbulb } from "lucide-react";
import { useTranslations } from "next-intl";

function HeroSection() {
  const t = useTranslations("HomePage.sections.hero");

  return (
    <section className="p-12 text-center">
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Sparkles className="h-4 w-4 mr-2" />
          {t("headline")}
        </div>
      </div>

      <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 max-w-4xl mx-auto leading-tight">
        {t("title")}
      </h1>

      <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
        {t("subtitle")}
      </p>

      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
        <Button size="lg" asChild className="gap-2">
          <Link href="/auth/register">
            <Lightbulb className="h-5 w-5" />
            {t("cta")}
          </Link>
        </Button>
      </div>

      <div className="bg-muted/50 rounded-lg p-6 max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.raw("cards").map((card: { metric: string; title: string }) => {
            return (
              <div className="text-center" key={card.title}>
                <h3 className="text-3xl font-bold text-primary mb-2">
                  {card.metric}
                </h3>
                <p className="text-muted-foreground">{card.title}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export { HeroSection };
