import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { icons } from "lucide-react";

export interface Benefit {
  title: string;
  description: string;
  icon: string;
}

interface FeaturesSectionProps {
  title: string;
}

const featureList: Benefit[] = [
  {
    icon: "Search",
    title: "AI-Powered Reddit Analysis",
    description:
      "Our platform scans thousands of Reddit posts to identify patterns in user pain points, feature requests, and market gaps that represent SaaS opportunities.",
  },
  {
    icon: "Lightbulb",
    title: "Validated SaaS Ideas",
    description:
      "Get detailed SaaS product concepts based on real user discussions, complete with validation evidence and implementation strategies.",
  },
  {
    icon: "BarChart2",
    title: "Competitive Landscape",
    description:
      "Understand existing solutions, their strengths and weaknesses, and identify the unique value proposition that will set your SaaS apart.",
  },
  {
    icon: "DollarSign",
    title: "Monetization Strategies",
    description:
      "Receive tailored pricing and monetization recommendations based on market analysis and user willingness to pay for specific solutions.",
  },
  {
    icon: "Code",
    title: "Implementation Complexity",
    description:
      "Get realistic assessments of technical challenges, development timelines, and resource requirements before you invest in building.",
  },
  {
    icon: "Save",
    title: "Idea Management",
    description:
      "Save, organize, and export your favorite SaaS opportunities to track your validation process and development journey.",
  },
];

export function FeaturesSection({ title }: FeaturesSectionProps) {
  return (
    <section id="features" className="container py-24 sm:py-32">
      <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
        {title}
      </h2>
      <h3 className="text-3xl md:text-4xl text-center font-bold mb-8">
        Powerful SaaS Discovery Tools
      </h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {featureList.map(({ title, description, icon }) => (
          <Card key={title}>
            <CardHeader>
              <div className="flex items-center mb-2">
                <Icon
                  name={icon as keyof typeof icons}
                  size={24}
                  className="text-primary mr-2"
                />
                <CardTitle>{title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">{description}</CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
