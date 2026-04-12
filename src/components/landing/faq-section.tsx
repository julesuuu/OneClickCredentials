import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How long does it take to process my request?",
    answer:
      "Document processing takes 5-7 business days. Rush processing is available for an additional fee.",
  },
  {
    question: "Can I request multiple documents at once?",
    answer:
      "Yes! You can request as many documents as you need in a single transaction. Bulk discounts may apply.",
  },
  {
    question: "What payment methods are accepted?",
    answer:
      "We accept online payments via Xendit (credit/debit cards, GCash, PayMaya) or cash on pickup.",
  },
  {
    question: "How will I know when my documents are ready?",
    answer:
      "You will receive email and SMS notifications, and you can track the status in your dashboard anytime.",
  },
  {
    question: "Can I cancel or modify my request?",
    answer:
      "Yes, you can cancel requests before they are processed. Contact support for modifications after submission.",
  },
];

export function FAQSection() {
  return (
    <section className="w-full py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            FAQ
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Got questions? We have answers.
          </p>
        </div>
        <Accordion type="single" collapsible className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
