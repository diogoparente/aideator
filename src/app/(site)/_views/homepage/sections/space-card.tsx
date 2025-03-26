import { cn } from "@/lib/utils";

export const SpaceCard = ({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) => (
  <div className="group relative overflow-hidden rounded-xl border border-secondary bg-card p-6 shadow-sm transition-all hover:shadow-md">
    <div className="flex items-start gap-4">
      <Icon className="mt-1 h-6 w-6 text-primary" />
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  </div>
);
