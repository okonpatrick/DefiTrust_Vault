# Hi there, we are DeFi Trust Vault! 👋

We are a team of passionate software developers with a keen interest in building innovative solutions in the Web3 and Decentralized Finance (DeFi) space. We enjoy working with modern web technologies to create intuitive and impactful user experiences.

## 🚀 About our Work

We are currently focused on developing decentralized applications that aim to bring more transparency and accessibility to financial services. Our flagship project is:

*   **DeFi Trust Vault:** A decentralized platform facilitating trust-based lending and borrowing, leveraging community endorsements and on-chain activity to build unique trust scores. This project explores novel ways to establish creditworthiness in a trustless environment.
    *   **Trust Scoring:** Users build a reputation score based on their on-chain activity and endorsements.
    *   **Community Endorsements:** Users can vouch for others, strengthening the network's trust layer and potentially earning rewards.
    *   **Decentralized Lending/Borrowing:** Access loans or provide liquidity based on trust scores and market dynamics.
You'll find various other experiments and projects on our profile, often exploring:
*   Smart Contract development
*   Frontend interfaces for dApps
*   Building robust and scalable backend systems for Web3 applications

## 🛠️ Tech Stack

We primarily work with the following technologies on this project:

*   **Frontend:** React, TypeScript, Tailwind CSS, Shadcn/ui, Framer Motion
*   **Backend:** No backend. User's data is decentralized
*   **Blockchain:** Solidity, Hardhat, Ethers.js, Web3.js
*   **Databases:** No database
*   **DevOps & Tools:** Git, Vercel

## ✨ Key Features
*   **Decentralized Identity & Trust:** Build your financial reputation on the blockchain.
*   **Peer-to-Peer Lending:** Directly lend and borrow with other users.
*   **Community-Driven Endorsements:** Leverage your network to enhance your borrowing potential. Endorsers can earn a percentage (e.g., 6%) of the borrowed amount upon successful loan completion.
*   **Transparent & On-Chain:** All core interactions are recorded on the blockchain for transparency.
*   **Modern User Interface:** Built with React, Shadcn/ui, and Framer Motion for a smooth experience.

##  prerequisites

Before you begin, ensure you have the following set up:

1.  **Node.js and npm/yarn:** Make sure you have Node.js (preferably a recent LTS version) and a package manager (npm or yarn) installed.
2.  **MetaMask Wallet:** You'll need the [MetaMask browser extension](https://metamask.io/download/) installed and configured. This will be your gateway to interacting with the DeFi Trust Vault smart contracts.
3.  **Test Network & Tokens:**
    *   Our platform is currently deployed on a test network (e.g. Avalanche Fuji Testnet). Make sure your MetaMask is connected to this network.
    *   You will need some test AVAX (or the native currency of the testnet) in your wallet to cover gas fees for transactions like registering, endorsing, or requesting loans.
    *   You might also need specific test tokens (e.g.AVAX) if the platform uses them for lending/borrowing. You can usually obtain these from a testnet faucet.

## 🚀 Getting Started

To get the DeFi Trust Vault application running locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/okonpatrick/DefiTrust_Vault.git
    cd trust_vault_app 
    ```
2.  **Install dependencies:**
    As mentioned below, you might encounter peer dependency issues. Use:
    ```bash
    npm install --force
    # or
    # npm install --legacy-peer-deps
    # or if using yarn:
    # yarn install --ignore-engines (or similar, depending on yarn version)
    ```
3.  **Set up Environment Variables:**
    If there are any environment variables required (e.g., contract addresses, API keys for RPC nodes), create a `.env.local` file by copying `.env.example` (if provided) and fill in the necessary values.
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
5.  Open http://localhost:5173 (or the port specified in your Vite config) in your browser.
6.  Connect your MetaMask wallet when prompted by the application.

## ❗ Important Note on Dependencies

Our projects involve cutting-edge libraries and rapidly evolving ecosystems. You might encounter peer dependency version mismatches when installing npm packages.

**To resolve this, please use one of the following commands:**

```bash
npm install --force
