import { Separator } from "@/components/ui/separator";
import siteConfig from "@/config/site-config";
import { ChevronsDown } from "lucide-react";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer id="footer" className="container py-24 sm:py-32 w-full">
      <div className="p-10 bg-card border border-secondary rounded-2xl">
        <div className="grid gap-8">
          <div className="flex justify-center">
            <Link
              href="#"
              className="flex font-bold items-center justify-center"
            >
              <ChevronsDown className="bg-gradient-to-tr border-secondary from-primary via-primary/70 to-primary rounded-lg w-9 h-9 mr-2 border text-white" />
              <h3 className="text-2xl">{siteConfig.footer.logo.text}</h3>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {siteConfig.footer.sections.map((section, sectionIndex) => (
              <div
                key={sectionIndex}
                className="flex flex-col gap-2 items-center"
              >
                <h3 className="font-bold text-lg">{section.title}</h3>
                {section.items.map((item) => (
                  <div key={item.href} className="flex w-1/2">
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex  opacity-60 hover:opacity-100"
                    >
                      {item.text}
                    </Link>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <Separator className="my-6" />
        <section className="text-center">
          <h3 className="text-muted-foreground">
            {siteConfig.title} {new Date().getFullYear()}
          </h3>
        </section>
      </div>
    </footer>
  );
}
