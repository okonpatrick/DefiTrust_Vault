import { LegalPageLayout } from "@/components/layout/LegalPageLayout";
import { motion } from "framer-motion";

export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" lastUpdated="November 15, 2023">
      <motion.section
        id="introduction"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-semibold text-gray-300">1. Introduction</h2>
        <p className="text-muted-foreground">
          This Privacy Policy outlines how DeFi Trust Vault ("we," "us," or "our") collects,
          uses, discloses, and protects your information when you interact with our decentralized
          platform and associated services (collectively, the "Service"). We are committed to
          protecting your privacy and handling your data in an open and transparent manner.
        </p>
      </motion.section>

      <motion.section
        id="information-we-collect"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="space-y-4 mt-8"
      >
        <h2 className="text-xl font-semibold text-gray-300">2. Information We Collect</h2>
        <p className="text-muted-foreground">
          Due to the decentralized nature of our Service, our collection of Personal Identifiable
          Information (PII) is minimized. The information we primarily interact with includes:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>
            <strong>Public Blockchain Data:</strong> Your blockchain wallet address, which is necessary
            to interact with our smart contracts, is inherently public and recorded on the blockchain.
            All transaction data (e.g., loan requests, endorsements, repayments, amounts, and involved
            addresses) is also publicly available on the blockchain. We do not control this data as it is
            part of the public ledger.
          </li>
          <li>
            <strong>User-Provided Information (Off-Chain):</strong> If you choose to contact us directly
            (e.g., for support, feedback, or inquiries via email or other communication channels), we may
            collect information you voluntarily provide, such as your name, email address, and the content
            of your communications.
          </li>
          <li>
            <strong>Website Usage Data (Anonymized):</strong> We may collect non-personally identifiable
            information about your interaction with our website interface (not the smart contracts directly).
            This may include browser type, operating system, pages visited, time spent on pages, and other
            anonymized analytics data collected through common tools like Google Analytics (or privacy-focused
            alternatives). This data is used to improve user experience and service functionality.
          </li>
        </ul>
      </motion.section>

      <motion.section
        id="how-we-use-information"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-4 mt-8"
      >
        <h2 className="text-xl font-semibold text-gray-300">3. How We Use Information</h2>
        <p className="text-muted-foreground">The information we collect is used for the following purposes:</p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li><strong>To Provide and Maintain the Service:</strong> Facilitating your interactions with the smart contracts and the platform's features.</li>
          <li><strong>To Improve the Service:</strong> Analyzing anonymized website usage data to understand user behavior and enhance the user interface and platform performance.</li>
          <li><strong>To Communicate With You:</strong> Responding to your inquiries, providing customer support, and sending important notices related to the Service (if you have provided contact information).</li>
          <li><strong>For Security and Fraud Prevention:</strong> Monitoring for and protecting against fraudulent or malicious activity, although the primary security relies on blockchain and smart contract audits.</li>
          <li><strong>To Comply with Legal Obligations:</strong> If required by law or valid legal process.</li>
        </ul>
      </motion.section>

      <motion.section
        id="information-sharing-and-disclosure"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="space-y-4 mt-8"
      >
        <h2 className="text-xl font-semibold text-gray-300">4. Information Sharing and Disclosure</h2>
        <p className="text-muted-foreground">
          We do not sell your PII. Information on the blockchain is public by its very nature. We may share
          information under the following limited circumstances:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li><strong>With Third-Party Service Providers:</strong> We may use third-party companies and individuals to facilitate our Service (e.g., website hosting, analytics providers, customer support tools). These third parties have access to your information only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.</li>
          <li><strong>For Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or a government agency), or to protect our rights, property, or safety, or that of our users or the public.</li>
        </ul>
      </motion.section>

      <motion.section
        id="contact-us"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="space-y-4 mt-8"
      >
        <h2 className="text-xl font-semibold text-gray-300">5. Contact Us</h2>
        <p className="text-muted-foreground">
          If you have any questions or concerns about this Privacy Policy or our data practices,
          please contact us at [Provide Contact Email or Link].
        </p>
      </motion.section>
    </LegalPageLayout>
  );
}
