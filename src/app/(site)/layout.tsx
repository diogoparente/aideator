import { SiteFooter } from "@/components/(site)/footer";
import { SiteHeader } from "@/components/(site)/header";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
