import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQProps {
  question: string;
  answer: string;
  value: string;
}

const faqs: FAQProps[] = [
  {
    question: "How does SaaS Insights find business opportunities?",
    answer:
      "Our platform uses advanced AI to analyze Reddit discussions across relevant subreddits. It identifies patterns in user pain points, feature requests, and market gaps, then generates detailed SaaS product ideas with validation steps and implementation strategies.",
    value: "item-1",
  },
  {
    question: "Which subreddits does the platform analyze?",
    answer:
      "We analyze posts from entrepreneurship, startup, SaaS, technology, and industry-specific subreddits. You can customize the subreddit categories to focus on your specific areas of interest.",
    value: "item-2",
  },
  {
    question: "How accurate are the AI-generated insights?",
    answer:
      "Our platform uses GPT-4o to analyze real user discussions, providing high-quality insights based on actual market needs. While no AI system is perfect, our algorithms are designed to filter out noise and focus on actionable, validated business opportunities.",
    value: "item-3",
  },
  {
    question: "Can I save and export the insights?",
    answer:
      "Yes! You can save your favorite insights, export them as PDFs or CSVs, and even create project boards to track your progress on implementing specific SaaS ideas.",
    value: "item-4",
  },
  {
    question: "How often is the Reddit data updated?",
    answer:
      "Our system fetches fresh data from Reddit in real-time when you perform a search. This ensures you're always getting the most current insights and trends.",
    value: "item-5",
  },
  {
    question: "Can I use this for validating my existing SaaS idea?",
    answer:
      "Absolutely! Enter keywords related to your existing idea to see what real users are saying about similar solutions, identify pain points you might not have considered, and get validation on your concept before investing significant resources.",
    value: "item-6",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="container py-24 sm:py-32">
      <div className="text-center mb-8">
        <h2 className="text-lg text-primary text-center mb-2 tracking-wider">
          Frequently Asked Questions
        </h2>
        <h3 className="text-3xl font-bold mb-4">
          Common Questions About SaaS Insights
        </h3>
      </div>
      <Accordion type="single" collapsible>
        {faqs.map(({ question, answer }, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger>{question}</AccordionTrigger>
            <AccordionContent>{answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
