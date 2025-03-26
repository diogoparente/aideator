import { BenefitsSection } from "./sections/benefits";
// import { ContactSection } from "./sections/contact";
import { FAQSection } from "./sections/faq";
import { FeaturesSection } from "./sections/features";
import { HeroSection } from "./sections/hero";
import { PricingSection } from "./sections/pricing";
import { TestimonialSection } from "./sections/testimonial";

const Homepage = () => (
  <div className="max-w-5xl mx-auto flex flex-col items-center">
    <HeroSection />
    <BenefitsSection />
    <FeaturesSection title="Features" />
    <PricingSection />
    <TestimonialSection />
    <FAQSection />
    {/* <ContactSection /> */}
  </div>
);

export { Homepage };
