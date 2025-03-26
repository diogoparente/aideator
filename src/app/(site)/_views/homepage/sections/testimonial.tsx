"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Star } from "lucide-react";

type Testimonial = {
  quote: string;
  author: string;
  role: string;
  company: string;
  numberOfStars: number;
};

const testimonials: Testimonial[] = [
  {
    author: "Alex Chen",
    company: "TechStartup Founder",
    quote:
      "SaaS Insights helped me discover a market gap I never would have found on my own. We're now building our MVP based on validated user pain points.",
    role: "Founder & CEO",
    numberOfStars: 5,
  },
  {
    author: "Sarah Johnson",
    company: "Product Hunt",
    quote:
      "The AI analysis of Reddit discussions saved us weeks of market research. We validated our SaaS idea in just hours instead of months.",
    role: "Product Manager",
    numberOfStars: 4,
  },
  {
    author: "Michael Torres",
    company: "SaaS Accelerator",
    quote:
      "I recommend SaaS Insights to all our portfolio companies. It's like having a crystal ball that shows you what users actually want.",
    role: "Investment Partner",
    numberOfStars: 5,
  },
];

export function TestimonialSection() {
  return (
    <section id="testimonials" className="container py-24 sm:py-32 w-full">
      <div className="text-center mb-8">
        <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
          Success Stories
        </h2>

        <h2 className="text-3xl md:text-4xl text-center font-bold mb-4">
          From Idea to Validated SaaS
        </h2>
        <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
          See how entrepreneurs are using SaaS Insights to discover and validate
          profitable business ideas.
        </p>
      </div>

      <div className="w-full max-w-screen-xl mx-auto">
        <Carousel
          opts={{
            align: "start",
          }}
          className="relative"
        >
          <CarouselContent>
            {testimonials.map((testimonial) => (
              <CarouselItem
                key={testimonial.author}
                className="md:basis-1/2 lg:basis-1/3"
              >
                <Card className="bg-muted/50 dark:bg-card h-full flex flex-col justify-between">
                  <CardContent className="pt-6 pb-0">
                    <div className="flex gap-1 pb-6 justify-center">
                      {[...Array(5)].map((_, index) => (
                        <Star
                          key={index}
                          className={`size-4 ${
                            index < testimonial.numberOfStars
                              ? "fill-primary text-primary"
                              : "fill-muted-foreground/25 text-muted-foreground/25"
                          }`}
                        />
                      ))}
                    </div>
                    {`"${testimonial.quote}"`}
                  </CardContent>

                  <CardHeader>
                    <div className="flex flex-row items-center gap-4">
                      <Avatar>
                        <AvatarImage
                          src="https://avatars.githubusercontent.com/u/75042455?v=4"
                          alt="radix"
                        />
                        <AvatarFallback>SV</AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col">
                        <CardTitle className="text-lg">
                          {testimonial.author}
                        </CardTitle>
                        <CardDescription>{testimonial.role}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
}
