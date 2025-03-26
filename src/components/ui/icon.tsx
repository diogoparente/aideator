import { icons } from "lucide-react";

interface IconProps {
  name: keyof typeof icons;
  color?: string;
  size?: number;
  className?: string;
}

export const Icon = ({ name, color, size, className }: IconProps) => {
  // Get the icon or use a fallback (CircleHelp) if the icon doesn't exist
  const LucideIcon = icons[name] || icons.CircleHelp;

  return <LucideIcon color={color} size={size} className={className} />;
};

export default Icon;
