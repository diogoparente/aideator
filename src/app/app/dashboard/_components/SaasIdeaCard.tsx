import React from "react";
import { Button } from "@/components/ui/button";

interface SaasIdeaCardProps {
  idea: {
    name: string;
    description: string;
    targetAudience: string;
    potentialFeatures: string[];
    supportingPostIds: string[];
  };
  onViewDetails: () => void;
}
const SaasIdeaCard = ({ idea, onViewDetails }: SaasIdeaCardProps) => (
  <div className="flex flex-col p-4 gap-4 border rounded-lg bg-accent">
    <div className="flex flex-grow justify-between items-start flex-1 h-full">
      <div className="flex-1 min-w-0">
        <h3 className="text-xl font-bold text-muted-foreground truncate mb-4">
          {idea.name}
        </h3>
        <p className="text-sm mt-1 line-clamp-2 font-semibold">
          {idea.description}
        </p>
        <div className="mt-2 space-y-1">
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-muted-foreground">
              Audience:
            </span>
            <span className="text-sm">{idea.targetAudience}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-muted-foreground">
              Features:
            </span>
            <span className="text-sm">
              {idea.potentialFeatures?.join(", ")}
            </span>
          </div>
        </div>
      </div>
    </div>
    <div className="flex justify-end">
      <Button onClick={onViewDetails} variant="default">
        View Details
      </Button>
    </div>
  </div>
);
export default SaasIdeaCard;
