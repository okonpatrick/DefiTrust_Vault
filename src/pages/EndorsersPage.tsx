import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Users, Percent, ShieldCheck, TrendingUp, Award, LinkIcon as LinkChainIcon } from "lucide-react";
import { Link } from "react-router-dom"; // Assuming you'll link to a dashboard or relevant section

const BenefitItem = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
  <div className="flex flex-col items-center text-center p-4 md:p-6 bg-gray-700/50 rounded-lg shadow-md hover:shadow-lg transition-shadow">
    <div className="p-3 mb-3 bg-teal-500/20 rounded-full">
      <Icon className="h-8 w-8 text-teal-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-100 mb-1">{title}</h3>
    <p className="text-sm text-gray-300 leading-relaxed">{description}</p>
  </div>
);

export function EndorsersPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 md:py-12 text-gray-100"
    >
      {/* Hero Section */}
      <section className="text-center mb-12 md:mb-16">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Award className="h-16 w-16 md:h-20 md:w-20 text-primary mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-teal-500 to-cyan-500 bg-clip-text text-transparent">
            Become a DeFi Trust Vault Endorser
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-6">
            Empower the community, build trust, and earn rewards by endorsing reliable borrowers on our platform.
          </p>
        </motion.div>
      </section>

      {/* Core Benefit: 6% Commission */}
      <section className="mb-12 md:mb-16">
        <Card className="bg-gradient-to-br from-primary/80 via-teal-600/80 to-gray-800 border-teal-500 shadow-xl rounded-xl overflow-hidden">
          <CardHeader className="p-6 md:p-8">
            <div className="flex items-center space-x-3 mb-2">
              <Percent className="h-10 w-10 md:h-12 md:w-12 text-gray-100 flex-shrink-0" />
              <CardTitle className="text-2xl md:text-3xl font-bold text-gray-100">
                Earn a 6% Commission!
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 text-gray-200">
            <p className="text-base md:text-lg leading-relaxed mb-4">
              As an endorser, you play a crucial role in our ecosystem. When a borrower you've endorsed successfully takes out and repays a loan, you earn a <strong className="text-teal-300 font-semibold">6% commission</strong> on the principal amount borrowed. It's our way of rewarding you for helping us build a trustworthy network.
            </p>
            <p className="text-sm text-gray-300">
              Example: If you endorse a user who borrows $1,000, you could earn $60 upon successful loan completion (terms and conditions apply).
            </p>
          </CardContent>
        </Card>
      </section>

      {/* How It Works & Other Benefits */}
      <section className="mb-12 md:mb-16">
        <h2 className="text-2xl md:text-3xl font-semibold text-center mb-8 text-gray-100">Why Become an Endorser?</h2>
        <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <BenefitItem
            icon={TrendingUp}
            title="Passive Income Stream"
            description="Earn commissions for each successful loan taken by users you endorse. The more trustworthy users you back, the more you can earn."
          />
          <BenefitItem
            icon={Users}
            title="Strengthen the Community"
            description="Your endorsements help reliable borrowers access funds and contribute to a more robust and fair DeFi ecosystem."
          />
          <BenefitItem
            icon={ShieldCheck}
            title="Build Your Reputation"
            description="Active and successful endorsements can enhance your own standing and trust score within the DeFi Trust Vault platform."
          />
        </div>
      </section>

      {/* Responsibilities & Call to Action */}
      <section className="text-center">
        <Card className="bg-gray-800 border-gray-700 shadow-lg rounded-xl p-6 md:p-8">
          <CardHeader>
            <div className="flex items-center justify-center space-x-3 mb-2">
              <LinkChainIcon className="h-8 w-8 text-teal-400" />
              <CardTitle className="text-xl md:text-2xl font-semibold text-gray-100">
                Ready to Make an Impact?
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 mb-6 leading-relaxed">
              Becoming an endorser means you're putting your reputation on the line to vouch for others. While it comes with rewards, it's important to endorse responsibly. Your actions contribute to the overall health and security of the platform.
            </p>
            <Link to="/trustvault"> {/* Link to dashboard or a specific "find users to endorse" page */}
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-gray-200 font-semibold px-8 py-3 text-base md:text-lg">
                Start Endorsing Now
                <Users className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="mt-4 text-sm text-gray-400">
              Learn more about the endorsement process in our <Link to="/faq#endorsing" className="text-teal-400 hover:text-teal-300 underline">FAQ section</Link>.
            </p>
          </CardContent>
        </Card>
      </section>
    </motion.div>
  );
}