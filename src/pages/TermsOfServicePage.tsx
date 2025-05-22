import { LegalPageLayout } from "@/components/layout/LegalPageLayout";
import { motion } from "framer-motion";

export function TermsOfServicePage() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdated="November 15, 2023">
      <motion.section
        id="acceptance-of-terms"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-semibold text-gray-300">1. Acceptance of Terms</h2>
        <p className="text-muted-foreground">
          By accessing or using the DeFi Trust Vault platform ("Service"), you
          ("User," "you," "your") agree to be bound by these Terms of Service
          ("Terms"), all applicable laws and regulations, and agree that you are
          responsible for compliance with any applicable local laws. If you do
          not agree with any of these terms, you are prohibited from using or
          accessing this Service. The materials contained in this Service are
          protected by applicable copyright and trademark law.
        </p>
      </motion.section>

      <motion.section
        id="description-of-service"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="space-y-4 mt-8"
      >
        <h2 className="text-xl font-semibold text-gray-300">2. Description of Service</h2>
        <p className="text-muted-foreground">
          DeFi Trust Vault provides a decentralized platform facilitating
          trust-based lending and borrowing, leveraging smart contracts on
          compatible blockchain networks. The Service includes, but is not
          limited to, user registration, trust score calculation based on
          on-chain and off-chain (where applicable and with user consent) data,
          mechanisms for users to endorse others, loan request functionalities,
          and loan repayment systems.
        </p>
      </motion.section>

      <motion.section
        id="user-responsibilities"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-4 mt-8"
      >
        <h2 className="text-xl font-semibold text-gray-300">
          3. User Responsibilities and Conduct
        </h2>
        <p className="text-muted-foreground">
          You are solely responsible for maintaining the confidentiality and
          security of your wallet, private keys, and any other credentials used
          to access the Service. You are responsible for all activities that
          occur under your wallet address.
        </p>
        <p className="text-muted-foreground">
          You agree to provide accurate, current, and complete information as
          may be prompted by any registration forms on the Service or otherwise
          requested by DeFi Trust Vault.
        </p>
        <p className="text-muted-foreground">
          You understand and acknowledge that interacting with smart contracts
          and decentralized financial applications involves significant risks,
          including but not limited to the risk of losing digital assets. DeFi
          Trust Vault is not liable for any losses incurred due to smart
          contract vulnerabilities, user error, network failures, market
          volatility, or any other risks inherent in using blockchain
          technology.
        </p>
      </motion.section>

      <motion.section
        id="prohibited-activities"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="space-y-4 mt-8"
      >
        <h2 className="text-xl font-semibold text-gray-300">4. Prohibited Activities</h2>
        <p className="text-muted-foreground">
          You agree not to engage in any of the following prohibited activities:
        </p>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>
            Engaging in any activity that is unlawful, fraudulent, or malicious,
            or that violates any applicable local, state, national, or
            international law or regulation.
          </li>
          <li>
            Attempting to interfere with, compromise the system integrity or
            security of, or decipher any transmissions to or from the servers
            running the Service.
          </li>
          <li>
            Using any automated system, including without limitation "robots,"
            "spiders," "offline readers," etc., to access the Service in a
            manner that sends more request messages to the DeFi Trust Vault
            servers than a human can reasonably produce in the same period by
            using a conventional on-line web browser.
          </li>
          <li>
            Impersonating another person or otherwise misrepresenting your
            affiliation with a person or entity, conducting fraud, hiding or
            attempting to hide your identity.
          </li>
          <li>Using the Service for any purpose for which it is not intended.</li>
        </ul>
      </motion.section>

      <motion.section
        id="risks-and-disclaimers"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="space-y-4 mt-8"
      >
        <h2 className="text-xl font-semibold text-gray-300">
          5. Risks, Disclaimers, and Limitation of Liability
        </h2>
        <p className="text-muted-foreground">
          THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. USE
          OF THE SERVICE IS AT YOUR OWN RISK. TO THE MAXIMUM EXTENT PERMITTED
          BY APPLICABLE LAW, THE SERVICE IS PROVIDED WITHOUT WARRANTIES OF ANY
          KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO,
          IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
          PURPOSE, OR NON-INFRINGEMENT.
        </p>
        <p className="text-muted-foreground">
          DeFi Trust Vault does not warrant that the Service will be available
          at any particular time or location; that any defects or errors will be
          corrected; or that the Service is free of viruses or other harmful
          components.
        </p>
        <p className="text-muted-foreground">
          Blockchain transactions are irreversible. You are solely responsible
          for any transactions you initiate or approve through the Service.
        </p>
      </motion.section>

      <motion.section
        id="contact-information"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="space-y-4 mt-8 text-gray-200"
      >
        <h2 className="text-xl font-semibold text-gray-300">6. Contact Information</h2>
        <p className="text-muted-foreground">
          If you have any questions about these Terms, please contact us at
          [Provide Contact Email or Link].
        </p>
      </motion.section>
    </LegalPageLayout>
  );
}
