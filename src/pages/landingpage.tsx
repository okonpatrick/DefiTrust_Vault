import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldCheck,
  Landmark,      // For Lending & Borrowing card title          // For Loan ID
  Coins
} from "lucide-react";
import { Handshake, Wallet, LineChart } from 'lucide-react';
import { Link } from "react-router-dom";


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex md:flex-row items-center justify-between px-4 md:px-16 py-20 md:min-h-screen"
      >
        <div className="md:w-1/2 space-y-8">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-500 to-red-500 bg-clip-text text-transparent"
          >
            Decentralized Credit Revolution
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-400"
          >
            Access fair credit based on community trust, decentralized collateral. 
            Build your financial reputation across the decentralized world.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex gap-4"
          >
            <Button className="bg-teal-600 hover:bg-teal-700 text-lg px-8 py-6">
              <Wallet className="mr-2" /> Connect Wallet
            </Button>
            <Button variant="outline" className="text-lg text-black hovr:text-teal-600 px-8 py-6">
              Learn More
            </Button>
          </motion.div>
        </div>
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="md:w-1/2 mt-12 md:mt-0"
        >
          <img 
            src="/avalanche4.png" 
            alt="Trust Network" 
            className="w-full max-w-xl ml-auto"
          />
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <section className="px-4 md:px-16 py-20 bg-gray-800/50">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-4">Why DeFiTrust?</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Revolutionizing decentralized finance through community-powered trust metrics
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gray-800 border-gray-700 hover:border-teal-500 transition-all">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-teal-500/20 rounded-full">
                      <feature.icon className="w-8 h-8 text-teal-500" />
                    </div>
                    <CardTitle className="text-2xl text-accent">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="px-4 md:px-16 py-20">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Build, maintain, and leverage your decentralized trust score in 3 simple steps
          </p>
        </div>

        <div className="md:flex md:flex-row  gap-8 justify-center">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
              className="flex-1 max-w-md"
            >
              <div className="flex flex-col items-center text-center p-8">
                <div className="mb-4 text-teal-500 text-2xl font-bold">
                  0{index + 1}
                </div>
                <step.icon className="w-12 h-12 mb-4 text-teal-500" />
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 md:px-16 py-20 bg-gradient-to-r from-primary/20 to-teal-600/20">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6">
              Ready to Join the Trust Revolution?
            </h2>
            <p className="text-gray-400 mb-8">
              Connect your wallet and start building your decentralized financial identity today
            </p>
            <Link to="/trustvault">
            <Button className="bg-teal-600 hover:bg-teal-700 px-12 py-8 text-lg">
              Get Started Now
            </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Trust Scoring",
    description: "Dynamic score based on your on-chain behavior and community endorsements"
  },
  {
    icon: Handshake,
    title: "Community Endorsements",
    description: "Grow your score through peer validation and staked endorsements"
  },
  {
    icon: Landmark,
    title: "Fair Lending",
    description: "Access credit with competitive rates based on your trustworthiness"
  }
];

const STEPS = [
  {
    icon: Wallet,
    title: "Connect Your Wallet",
    description: "Securely link your Web3 wallet to start building your trust history"
  },
  {
    icon: LineChart,
    title: "Build Your Reputation",
    description: "Participate in the ecosystem to grow your trust score"
  },
  {
    icon: Coins,
    title: "Borrow & Lend",
    description: "Access better rates as your trust score improves"
  }
];