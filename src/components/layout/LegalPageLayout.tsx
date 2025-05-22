import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { FileText, CalendarDays } from "lucide-react";
import type { FC, ReactNode } from 'react';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

export const LegalPageLayout: FC<LegalPageLayoutProps> = ({ title, lastUpdated, children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 md:py-12" // Responsive padding
    >
      <Card className="bg-gray-800 border-gray-700 shadow-xl rounded-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary to-teal-600 p-6 md:p-8 text-gray-100">
          <div className="flex items-center space-x-3 mb-2">
            <FileText className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0" />
            <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-bold">{title}</CardTitle>
          </div>
          <CardDescription className="text-gray-300 flex items-center text-sm md:text-base">
            <CalendarDays className="mr-2 h-4 w-4 flex-shrink-0" />
            Last Updated: {lastUpdated}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 md:p-8 text-gray-200 prose prose-sm sm:prose-base lg:prose-lg xl:prose-xl prose-invert max-w-none 
                                prose-headings:text-gray-100 prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3
                                prose-p:text-gray-300 prose-p:leading-relaxed
                                prose-a:text-teal-400 prose-a:hover:text-teal-300 prose-a:transition-colors
                                prose-strong:text-gray-100
                                prose-ul:list-disc prose-ul:ml-5 prose-ol:list-decimal prose-ol:ml-5 prose-li:my-1">
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
};