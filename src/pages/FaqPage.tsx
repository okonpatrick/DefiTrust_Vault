import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { HelpCircle, Search } from "lucide-react";
import { useState, useMemo } from "react";

const faqData = [
  {
    category: "General",
    questions: [
      {
        q: "What is DeFi Trust Vault?",
        a: "DeFi Trust Vault is a decentralized platform that facilitates trust-based lending and borrowing. It leverages community endorsements and on-chain activity to build a unique trust score, enabling users to access financial services.",
      },
      {
        q: "How is this different from traditional lending?",
        a: "Unlike traditional systems that rely on centralized credit bureaus, DeFi Trust Vault uses a decentralized trust mechanism. Your reputation and community backing play a significant role in your borrowing capacity and terms.",
      },
    ],
  },
  {
    category: "Trust Score",
    questions: [
      {
        q: "How is my Trust Score calculated?",
        a: "Your Trust Score is calculated based on a combination of factors including your on-chain transaction history, loan repayment history on our platform, and endorsements received from other trusted members of the community.",
      },
      {
        q: "How can I improve my Trust Score?",
        a: "You can improve your Trust Score by successfully repaying loans on time, maintaining a good transaction history on the supported blockchain, and receiving endorsements from users with high trust scores.",
      },
    ],
  },
  {
    category: "Endorsing",
    questions: [
      {
        q: "What does it mean to endorse someone?",
        a: "Endorsing someone means you are vouching for their trustworthiness and reliability within the DeFi Trust Vault ecosystem. It can positively impact their Trust Score.",
      },
      {
        q: "Are there any risks to endorsing someone?",
        a: "While endorsing helps build the community, be mindful that your reputation can be linked to those you endorse. The specific implications of an endorsed party defaulting will be outlined in the platform's operational details. Endorsers also earn a commission when their endorsed users borrow.",
      },
    ],
  },
  {
    category: "Borrowing & Lending",
    questions: [
      {
        q: "How do I request a loan?",
        a: "Once your wallet is connected and you have a sufficient Trust Score, you can navigate to the 'Request Loan' section, specify the amount and terms, and submit your request to the marketplace.",
      },
      {
        q: "What are the interest rates?",
        a: "Interest rates can vary based on market conditions, the borrower's Trust Score, and the terms of the loan. Lenders may propose rates when funding a loan request.",
      },
    ],
  },
  // Add more categories and questions as needed
];

export function FaqPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFaqData = useMemo(() => {
    if (!searchTerm) return faqData;
    return faqData
      .map(category => ({
        ...category,
        questions: category.questions.filter(
          qna =>
            qna.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
            qna.a.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      }))
      .filter(category => category.questions.length > 0);
  }, [searchTerm]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 md:py-12"
    >
      <Card className="bg-gray-800 border-gray-700 shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary to-teal-600 p-6 md:p-8 text-gray-100">
          <div className="flex items-center space-x-3 mb-2">
            <HelpCircle className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0" />
            <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-bold">
              Help Center & FAQ
            </CardTitle>
          </div>
          <CardDescription className="text-gray-300 text-sm md:text-base">
            Find answers to common questions about DeFi Trust Vault.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 text-gray-200">
          <div className="mb-6 relative">
            <Input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-teal-500 focus:border-teal-500"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>

          {filteredFaqData.map((categoryItem) => (
            <div key={categoryItem.category} className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-100 mb-4 border-b border-gray-700 pb-2">
                {categoryItem.category}
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {categoryItem.questions.map((item, index) => (
                  <AccordionItem value={`item-${categoryItem.category}-${index}`} key={index} className="border-gray-700">
                    <AccordionTrigger className="text-left hover:no-underline text-gray-200 hover:text-teal-400">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-300 prose prose-sm sm:prose-base prose-invert max-w-none">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
          {filteredFaqData.length === 0 && (
            <p className="text-center text-gray-400">No questions found matching your search.</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}