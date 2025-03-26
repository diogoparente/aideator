"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { icons } from "lucide-react";
import { useTranslations } from "next-intl";

interface Benefit {
  title: string;
  description: string;
  icon: string;
}

const BenefitsSection = () => {
  const t = useTranslations("HomePage.sections.benefits");

  return (
    <section id="benefits" className="py-24 sm:py-32">
      <div className="grid lg:grid-cols-2 place-items-center lg:gap-24">
        <div>
          <h2 className="text-lg text-primary mb-2 tracking-wider">
            {t("headline")}
          </h2>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("title")}</h2>
          <p className="text-xl text-muted-foreground mb-8">{t("subtitle")}</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8 w-full">
          {t
            .raw("cards")
            .map(
              (
                { icon = "Blocks", title, description }: Benefit,
                index: number
              ) => (
                <Card
                  key={title}
                  className="bg-muted/50 dark:bg-card hover:bg-background transition-all delay-75 group/number"
                >
                  <CardHeader>
                    <div className="flex justify-between">
                      <Icon
                        name={icon as keyof typeof icons}
                        size={32}
                        color="hsl(var(--primary))"
                        className="mb-6 text-primary"
                      />
                      <span className="text-5xl text-muted-foreground font-medium transition-all delay-75 group-hover/number:text-muted-foreground/30">
                        0{index + 1}
                      </span>
                    </div>
                    <CardTitle>{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">
                    {description}
                  </CardContent>
                </Card>
              )
            )}
        </div>
      </div>
    </section>
  );
};

export { BenefitsSection };
