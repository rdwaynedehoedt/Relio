"use client";

import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const easeOut = [0.16, 1, 0.3, 1] as const;

const faqs = [
  {
    question: "Is Relio really free?",
    answer:
      "Yes completely free, forever. No credit card, no trial period, no hidden tiers.",
  },
  {
    question: "How is this different from HubSpot or Notion?",
    answer:
      "Relio is personal. HubSpot is for teams and sales pipelines. Notion is for docs. Relio is for you your contacts, your money, your goals, all linked.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Your data is stored in Firebase Firestore, secured by Google Cloud infrastructure. Only you can access your data.",
  },
  {
    question: "Can I import my existing contacts?",
    answer:
      "Yes import from HubSpot, Google Contacts, LinkedIn CSV, or a VCF file from your phone. Connect Google once to sync both Contacts and Calendar.",
  },
  {
    question: "Does Relio sync with Google Calendar?",
    answer:
      "Yes. Connect Google in Settings → Integrations to import contacts and sync your calendar. Today's meetings appear on your dashboard, and the Calendar page shows a week view with attendees matched to your contacts.",
  },
  {
    question: "What if Google integration doesn't work right away?",
    answer:
      "Google requires a one-time setup in Cloud Console (People API and Calendar API). Relio includes a Test connection button and guided steps that tell you exactly what to enable if something is missing.",
  },
  {
    question: "Does it work on mobile?",
    answer:
      "Yes Relio is a PWA. Open it in Safari on iPhone and add it to your home screen.",
  },
  {
    question: "What currencies does the finance tracker support?",
    answer:
      "LKR, USD, GBP, AED, and AUD with live mid-market exchange rates updated daily.",
  },
];

export function LandingFAQ() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-[680px] px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: easeOut }}
          className="text-center"
        >
          <h2 className="text-2xl font-medium tracking-tight text-[#0a0a0a] sm:text-3xl">
            Frequently asked questions
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, ease: easeOut, delay: 0.1 }}
          className="mt-10"
        >
          <Accordion className="w-full">
            {faqs.map((faq) => (
              <AccordionItem key={faq.question} value={faq.question}>
                <AccordionTrigger className="py-5 text-left text-base font-medium text-[#0a0a0a] hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-neutral-500">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
