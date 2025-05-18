// app/trustvault/page.tsx
"use client";

// Extend the Window interface to include 'ethereum'
declare global {
  interface Window {
    ethereum?: unknown;
  }
}

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import TrustChainABI from "@/abis/TrustChain.json";
import { Input } from "@/components/ui/input"; // Assuming you have shadcn Input component
import { Label } from "@/components/ui/label"; // Assuming you have shadcn Label component
import { toast } from "sonner";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  CheckCircle,
  XCircle,
  ShieldCheck,
  UserCheck, // Keep existing UserCheck
  Landmark,      // For Lending & Borrowing card title
  HandCoins,     // For "Request a Loan" section title
  ListChecks,    // For "Your Active Loans" section title
  Send,          // For "Request Loan" button
  Loader2,       // For loading state in buttons
  FileText,      // For "No active loans" message
  Hash,          // For Loan ID
  Coins,         // For Amount/Repayment Amount
  Percent,       // For Interest Rate (ensure it's aliased if 'Percent' is a component name)
  CalendarDays,  // For Requested Date
  User as UserIcon, // Aliased to avoid conflict if 'User' is a component name
  CalendarClock, // For Repayment Deadline
  Info,
  PiggyBank,
  Banknote,      // For Repay Loan button
        // For Status and general info messages
} from "lucide-react";

const CONTRACT_ADDRESS =
  import.meta.env.VITE_PUBLIC_CONTRACT_ADDRESS || "undefined";
const RPC_URL =
  import.meta.env.VITE_PUBLIC_DEFAULT_RPC_URL ||
  "https://api.avax-test.network/ext/bc/C/rpc";
// You might want to add VITE_FUJI_CHAIN_ID for network checks
// const EXPECTED_CHAIN_ID = import.meta.env.VITE_FUJI_CHAIN_ID;

interface UserData {
  trustScore: bigint;
  loansCompleted: bigint;
  loansDefaulted: bigint;
  totalStakedOnUser: bigint;
  isRegistered: boolean;
}

interface LoanData {
  loanId: bigint;
  borrower: string;
  amount: bigint;
  interestRate: bigint;
  repaymentAmount: bigint;
  requestedTimestamp: bigint;
  approvalTimestamp: bigint;
  repaymentDeadline: bigint;
  lender: string;
  status: number; // Corresponds to LoanStatus enum
}

// Types matching contract structures (or subset for display)
// interface UserContractData {
//   userAddress: string;
//   trustScore: BigNumberish;
//   endorsementsReceivedCount: BigNumberish;
//   totalStakedOnUser: BigNumberish;
//   loansCompleted: BigNumberish;
//   loansDefaulted: BigNumberish;
//   isRegistered: boolean;
// }

// interface DisplayableScoreData {
//   score: number;
//   onChainActivity: Array<{ metric: string; value: string; icon: string }>; // Keep this structure for UI
//   endorsements: number;
//   loanHistory: {
//     completed: number;
//     defaulted: number;
//   };
//   isRegistered: boolean;
// }

// interface PoolStats {
//   totalLiquidity: number; // In AVAX (ethers)
//   apy: number; // Placeholder
//   riskLevel: string; // Placeholder
//   activeLoans: number; // Count
//   availableToBorrow: number; // In AVAX (ethers)
// }

// interface Endorsee {
//   id: string; // address
//   name: string; // for display, could be address or ENS if resolved
//   trustScore: number;
//   avatarUrl: string; // keep for UI, can be generic
//   dataAiHint?: string;
// }

// Helper to convert loan status number to a readable string
const getLoanStatusString = (status: number): string => {
    console.log(`DEBUG_STATUS_FN: Received status value: ${status}, type: ${typeof status}`);
  switch (status) {
    case 0:
      return "Requested";
    case 1:
      return "Approved / Active";
    case 2:
      return "Repaid";
    case 3:
      return "Defaulted";
    case 4:
      return "Cancelled";
    default:
            console.log(`DEBUG_STATUS_FN: Status ${status} (type: ${typeof status}) did not match any case, returning "Unknown".`);

      return "Unknown";
  }
};

export default function TrustVaultPage() {
  const [account, setAccount] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [activeLoans, setActiveLoans] = useState<LoanData[]>([]);

  // State for input fields
  const [endorseeAddress, setEndorseeAddress] = useState("");
  const [endorseAmount, setEndorseAmount] = useState(""); // Stored as string, converted to BigInt/Wei later
  const [loanAmount, setLoanAmount] = useState(""); // Stored as string, converted to BigInt/Wei later
  const [repayingLoanId, setRepayingLoanId] = useState<bigint | null>(null);

  const [totalLiquidity, setTotalLiquidity] = useState<bigint | null>(null);
  const [isLoadingTotalLiquidity, setIsLoadingTotalLiquidity] = useState(false);


  const contractAbi = TrustChainABI;

  //const { account, trustChainContract, isCorrectNetwork, setLoading: setWeb3Loading } = useWeb3();
  // const errorDecoder = ErrorDecoder.create();
  // const [userContractData, setUserContractData] =
  //   useState<UserContractData | null>(null);
  // const [displayScoreData, setDisplayScoreData] =
  //   useState<DisplayableScoreData | null>(null);
  // const [lendingPoolStats, setLendingPoolStats] = useState<PoolStats | null>(
  //   null
  // );
  // const [potentialEndorsees, setPotentialEndorsees] = useState<Endorsee[]>([]);
  // const [isRegistering, setIsRegistering] = useState(false);
  // const [isUserNewlyRegistered, setIsUserNewlyRegistered] = useState(false);

  //   fetchPotentialEndorsees = async () => {
  //   return(<></>)
  // }

  // fetchUserData = async () => {
  //   return(<></>)
  // }
  // fetchPoolData = async () => {
  //   return(<></>)
  // }

  async function fetchTotalLiquidity() {
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "undefined") {
      console.error("Contract address not set, cannot fetch total liquidity.");
      // setError("Missing contract address for liquidity."); // Or handle silently
      return;
    }
    setIsLoadingTotalLiquidity(true);
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractAbi,
        provider
      );
      const liquidity = await contract.totalLiquidity();
      setTotalLiquidity(liquidity);
    } catch (e: unknown) {
      console.error("Failed to fetch total liquidity:", e);
      toast.error("Error", { description: "Could not fetch pool liquidity." });
      setTotalLiquidity(null); // Clear on error
    } finally {
      setIsLoadingTotalLiquidity(false);
    }
  }

  useEffect(() => {
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === "undefined") {
      console.error("VITE_PUBLIC_CONTRACT_ADDRESS is not set in .env file");
      setError("Missing contract address configuration.");
    }
  }, []);

  async function connectWallet() {
    setError(null);
    setIsLoading(true);
    try {
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is not installed.");
        // Use toast for a more user-friendly notification
        toast.error("MetaMask Not Detected", {
          description:
            "Please install the MetaMask extension to connect your wallet.",
        });
        setError("MetaMask is not installed."); // Keep setting state if other UI depends on it
        return; // Exit early
      }
      const provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      const newSigner = await provider.getSigner();
      setSigner(newSigner);
    } catch (e: unknown) {
      console.error("Wallet connection error:", e); // Log the full error for debugging

      // Check for MetaMask specific "Already processing" error
      // The error code -32002 is common for this.
      // Ethers.js might wrap the original error, so check e.error.code as well.
      if (
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (e as { code?: unknown }).code === -32002
      ) {
        toast.info("Connection Request Pending", {
          description:
            "Please check your MetaMask extension to complete the connection request.",
        });
        setError(
          "A connection request is already pending in MetaMask. Please check your extension."
        );
      } else if (
        typeof e === "object" &&
        e !== null &&
        "error" in e &&
        typeof (e as { error?: unknown }).error === "object" &&
        (e as { error: { code?: unknown } }).error &&
        (e as { error: { code?: unknown } }).error.code === -32002
      ) {
        toast.info("Connection Request Pending", {
          description:
            "Please check your MetaMask extension to complete the connection request.",
        });
        setError(
          "A connection request is already pending in MetaMask. Please check your extension."
        );
      } else if (
        typeof e === "object" &&
        e !== null &&
        "code" in e &&
        (e as { code?: unknown }).code === 4001
      ) {
        // Standard EIP-1193 user rejected request error
        toast.warning("Connection Rejected", {
          description:
            "You rejected the wallet connection request in MetaMask.",
        });
        setError("Wallet connection request rejected by user.");
      } else {
        const errorMessage =
          typeof e === "object" &&
          e !== null &&
          "message" in e &&
          typeof (e as { message?: unknown }).message === "string"
            ? (e as { message: string }).message
            : "Failed to connect wallet. Please try again.";
        toast.error("Connection Failed", {
          description: errorMessage,
        });
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchUser() {
    if (!account || !CONTRACT_ADDRESS) {
      setError("Please connect wallet or set contract address.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractAbi,
        provider
      );
      const user = await contract.getUser(account);
      setUserData(user);
    } catch (e: unknown) {
      // Check if the error is "User not registered"
      if (
        typeof e === "object" &&
        e !== null &&
        "message" in e &&
        typeof (e as { message?: unknown }).message === "string" &&
        (e as { message: string }).message.includes("User not registered")
      ) {
        console.log("User not registered, showing registration button");
        // Clear error since this is an expected state for new users
        setError(null);
      } else if (
        typeof e === "object" &&
        e !== null &&
        "message" in e &&
        typeof (e as { message?: unknown }).message === "string"
      ) {
        setError((e as { message: string }).message || "Failed to fetch user.");
      } else {
        setError("Failed to fetch user.");
      }
      setUserData(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function registerUser() {
    if (!signer || !CONTRACT_ADDRESS) {
      setError("Please connect wallet or set contract address.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractAbi,
        signer
      );
      const tx = await contract.registerUser();
      await tx.wait();
      await fetchUser();
    } catch (e: unknown) {
      if (
        e &&
        typeof e === "object" &&
        "message" in e &&
        typeof (e as { message?: unknown }).message === "string"
      ) {
        setError((e as { message: string }).message);
      } else {
        setError("Failed to register.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchActiveLoans() {
    if (!account || !CONTRACT_ADDRESS) {
      setActiveLoans([]); // Clear loans if not connected
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const readOnlyProvider = new ethers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractAbi,
        readOnlyProvider
      );

      const loanIds: bigint[] = await contract.getActiveLoansForUser(account);
      const loanDetails: LoanData[] = [];

      for (const loanId of loanIds) {
        // Fetch raw data from the contract
        const rawLoanData = await contract.getLoan(loanId);

        // Log raw status and its type for definitive debugging
        console.log(
          `DEBUG_FETCH: Loan ID: ${rawLoanData.loanId.toString()}, ` +
          `Raw Status value from contract: ${rawLoanData.status}, ` +
          `Type of rawLoanData.status: ${typeof rawLoanData.status}`
        );

        // Construct the LoanData object, ensuring correct types as defined in your LoanData interface
        const formattedLoan: LoanData = {
          loanId: BigInt(rawLoanData.loanId),
          borrower: rawLoanData.borrower,
          amount: BigInt(rawLoanData.amount),
          interestRate: BigInt(rawLoanData.interestRate),
          repaymentAmount: BigInt(rawLoanData.repaymentAmount),
          requestedTimestamp: BigInt(rawLoanData.requestedTimestamp),
          approvalTimestamp: BigInt(rawLoanData.approvalTimestamp),
          repaymentDeadline: BigInt(rawLoanData.repaymentDeadline),
          lender: rawLoanData.lender,
          status: Number(rawLoanData.status), // Explicitly convert status to Number
        };
        loanDetails.push(formattedLoan);
        
      }
      setActiveLoans(loanDetails);
    } catch (e: unknown) {
      setError((e as { message: string }).message || "Failed to fetch active loans.");
      console.error(e);
      setActiveLoans([]); // Clear old data on error
    }
    setIsLoading(false);
  }

  async function handleEndorseUser() {
    if (!signer || !CONTRACT_ADDRESS) {
      setError("Please connect wallet or ensure contract address is set.");
      return;
    }
    if (!ethers.isAddress(endorseeAddress)) {
      setError("Invalid endorsee address.");
      return;
    }
    if (endorseeAddress.toLowerCase() === account?.toLowerCase()) {
      setError("Cannot endorse yourself.");
      return;
    }
    let amountWei;
    try {
      amountWei = ethers.parseEther(endorseAmount);
      if (amountWei <= 0n) throw new Error("Amount must be positive.");
    } catch {
      setError("Invalid stake amount. Please enter a positive number.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractAbi,
        signer
      );
      const tx = await contract.endorseUser(endorseeAddress, {
        value: amountWei,
      });
      await tx.wait();
      setError("User endorsed successfully!"); // Use error state for success message temporarily
      setEndorseeAddress(""); // Clear input
      setEndorseAmount(""); // Clear input
      fetchUser(); // Refresh user data (trust score, total staked)
    } catch (e: unknown) {
      setError((e as { message: string }).message || "Failed to endorse user.");
      console.error(e);
    }
    setIsLoading(false);
  }

  useEffect(() => {
    if (account) {
      fetchUser();
      fetchActiveLoans(); // Fetch active loans when account changes/connects
    } else {
      setUserData(null);
      setActiveLoans([]); // Clear loans if account disconnects
    }
  }, [account]);

  async function handleRequestLoan() {
    if (!signer || !CONTRACT_ADDRESS) {
      setError("Please connect wallet or ensure contract address is set.");
      return;
    }

    let amountWei;
    try {
      amountWei = ethers.parseEther(loanAmount);
      if (amountWei <= 0n) {
        // Use 0n for BigInt comparison
        setError("Loan amount must be a positive number.");
        return;
      }
    } catch {
      setError("Invalid loan amount. Please enter a valid number.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractAbi,
        signer
      );
      const tx = await contract.requestLoan(amountWei);
      await tx.wait();
      setError("Loan requested successfully!"); // Using setError for success message for consistency
      setLoanAmount(""); // Clear input
      fetchActiveLoans(); // Refresh active loans list
      // Optionally, refresh user data if it changes upon loan request
      // fetchUser();
    } catch (e: unknown) {
      // Log the full error object for debugging purposes
      console.error("Loan request failed:", e);

      if (
        typeof e === "object" &&
        e !== null &&
        "reason" in e &&
        typeof e.reason === "string" &&
        e.reason.includes("Trust score too low")
      ) {
        // Use a single, more descriptive sonner toast for this specific error
        toast.error("Loan Request Failed: Trust score too low", {
          description:
            "Your current trust score does not meet the minimum requirement for this loan.",
        });
        // You might want to clear the general error if the toast is sufficient
        // setError(null);
      } else if (e instanceof Error) {
        setError(
          e.message || "An unexpected error occurred while requesting the loan."
        );
      } else {
        setError("An unknown error occurred while requesting the loan.");
      }
    } finally {
      setIsLoading(false);
    }
  }


  // Effect for initial data loading that doesn't require a user wallet
  useEffect(() => {
    if (CONTRACT_ADDRESS && CONTRACT_ADDRESS !== "undefined") {
      fetchTotalLiquidity();
    } else {
      console.log("Contract address not available for initial data load.");
    }
  }, []); // Runs once on mount

async function handleRepayLoan(loanToRepay: LoanData) {
    if (!signer || !CONTRACT_ADDRESS) {
      toast.error("Error", { description: "Please connect wallet or ensure contract address is set." });
      return;
    }
    if (loanToRepay.status !== 1) { // Not Approved/Active
      toast.warning("Repayment Not Allowed", { description: "This loan is not currently active for repayment." });
      return;
    }

    setRepayingLoanId(loanToRepay.loanId);
    setError(null); // Clear previous general errors

    try {
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractAbi,
        signer
      );

      toast.info("Processing Repayment", { description: `Attempting to repay loan ID: ${loanToRepay.loanId.toString()}. Please confirm in your wallet.` });

      const tx = await contract.repayLoan(loanToRepay.loanId, {
        value: loanToRepay.repaymentAmount, // Send the required repayment amount
      });

      await tx.wait();

      toast.success("Loan Repaid Successfully!", {
        description: `Loan ID: ${loanToRepay.loanId.toString()} has been repaid.`,
      });

      fetchActiveLoans(); // Refresh active loans list
      fetchUser();        // Refresh user data (trust score, completed loans)
      fetchTotalLiquidity(); // Refresh total liquidity as it increases

    } catch (e: unknown) {
      console.error("Loan repayment failed:", e);
      const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during repayment.";
      toast.error("Repayment Failed", { description: errorMessage });
    } finally {
      setRepayingLoanId(null);
    }
  }

  return (
    <>
      <div className="flex md:flex-row gap-6 items-stretch mx-4 md:mx-16 bg-gray-900 p-6">
        {/* Trust Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1"
        >
          <Card className="bg-gray-800 border-gray-700 shadow-lg rounded-xl h-1/2">
            <CardHeader className="bg-gradient-to-r from-primary to-teal-600 p-6 text-gray-100 rounded-t-xl">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">
                  Your Trust Score
                </CardTitle>
                <ShieldCheck className="h-7 w-7 text-gray-100" />
              </div>
              <CardDescription className="text-gray-200">
                Access decentralized credit based on trust, not collateral.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 bg-gray-800 text-gray-100 rounded-b-xl">
              {/* ... rest of trust score content ... */}
              {error && (
                <p className="text-sm text-red-500 bg-red-100 p-2 rounded mb-4">
                  {error}
                </p>
              )}

              {!account ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Connect your wallet to view your trust score.
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    <span className="text-muted-foreground">Network:</span> Fuji
                    Testnet
                  </p>

                  <Button
                    onClick={connectWallet}
                    disabled={isLoading || !CONTRACT_ADDRESS}
                  >
                    {isLoading ? "Connecting..." : "Connect Wallet"}
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm  mb-2">
                    Connected as:{" "}
                    <span className="text-muted-foreground">{account}</span>
                  </p>
                  <Button
                    onClick={fetchUser}
                    disabled={isLoading || !CONTRACT_ADDRESS}
                  >
                    {isLoading ? "Fetching..." : "Fetch Profile"}
                  </Button>
                  <div className="mt-4 space-y-4">
                    {!userData ? (
                      <p className="text-sm text-muted-foreground">
                        No user data found. Please register.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-base">
                          <span className="font-medium">Trust Score:</span>{" "}
                          {userData.trustScore.toString()}
                          <Progress
                            value={Number(userData.trustScore)}
                            className="h-2 w-1/2 bg-gray-200"
                          />
                        </div>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-1 text-sm">
                            <CheckCircle className="text-green-500 h-4 w-4" />{" "}
                            Loans Completed:{" "}
                            {userData.loansCompleted.toString()}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <XCircle className="text-red-500 h-4 w-4" /> Loans
                            Defaulted: {userData.loansDefaulted.toString()}
                          </div>
                        </div>
                        <div className="text-sm text-gray-200">
                          <strong>Total Staked on You:</strong>{" "}
                          {ethers.formatEther(userData.totalStakedOnUser)} AVAX
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <TrendingUp className="h-4 w-4 text-gray-200" />
                                <span className="text-sm font-medium text-gray-400">
                                  Score Factors
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-card text-card-foreground border shadow-md p-3 text-sm">
                              Scores increase with positive lending behavior,
                              on-chain history, and endorsements.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                  </div>
                  {account && (!userData || !userData.isRegistered) && (
                    <Button
                      variant="secondary"
                      onClick={registerUser}
                      disabled={isLoading || !CONTRACT_ADDRESS}
                      className="mt-4"
                    >
                      {isLoading ? "Registering..." : "Register"}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Endorsement Card */}
        {account && userData?.isRegistered && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-1"
          >
            <Card className="bg-gray-800 border-gray-700 shadow-lg rounded-xl h-1/2">
              <CardHeader className="bg-gradient-to-r from-primary to-teal-600 p-6 text-gray-100 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold">
                    Endorse User
                  </CardTitle>
                  <UserCheck className="h-7 w-7 text-gray-100" />
                </div>
                <CardDescription className="text-gray-200">
                  Stake AVAX to endorse other users and boost their trust score
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 bg-gray-800 rounded-b-xl space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="endorseeAddress"
                        className="text-gray-300"
                      >
                        Endorsee Address
                      </Label>
                    </div>
                    <Input
                      id="endorseeAddress"
                      className="bg-gray-700 border-gray-600 text-gray-100 focus:ring-primary"
                      placeholder="0x..."
                      value={endorseeAddress}
                      onChange={(e) => setEndorseeAddress(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endorseAmount" className="text-gray-300">
                      Stake Amount (AVAX)
                    </Label>
                    <Input
                      id="endorseAmount"
                      className="bg-gray-700 border-gray-600 text-gray-100 focus:ring-primary"
                      placeholder="0.1"
                      value={endorseAmount}
                      onChange={(e) => setEndorseAmount(e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                  onClick={handleEndorseUser}
                >
                  {isLoading ? "Endorsing..." : "Confirm Endorsement"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

{/* Lending Pool Interface */ }
      <div className="mx-4 md:mx-16 mt-8"> {/* Adjusted container to match horizontal margins and add top spacing */}
        <motion.div
          className="w-full "
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }} // Added delay assuming it loads after top cards
        >
          <Card className="bg-gray-800 border-gray-700 shadow-lg rounded-xl"> {/* Matched card styling */}
            <CardHeader className="bg-gradient-to-r from-primary to-teal-600 p-6 text-gray-100 rounded-t-xl">
              <div className="flex items-center justify-between ">
                <CardTitle className="text-2xl font-bold flex items-center">
                  <Landmark className="mr-3 h-7 w-7" />
                  Lending & Borrowing
                </CardTitle>
              </div>
              <CardDescription className="text-gray-200">
                Manage your loan requests and view active loans.
              </CardDescription>
              {/* Display Total Liquidity */}
              {isLoadingTotalLiquidity && (
                <div className="mt-3 pt-3 border-t border-gray-700/50">
                  <div className="flex items-center text-gray-400">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span className="text-sm">Loading pool liquidity...</span>
                  </div>
                </div>
              )}
              {!isLoadingTotalLiquidity && totalLiquidity !== null && (
                <div className="mt-3 pt-3 border-t border-gray-700/50">
                  <div className="flex items-center text-gray-200">
                    <PiggyBank className="mr-2 h-5 w-5 text-teal-300" />
                    <span className="text-sm font-medium">Total Pool Liquidity:</span>
                    <span className="ml-auto text-lg font-semibold text-teal-300">
                      {ethers.formatEther(totalLiquidity)} AVAX
                    </span>
                  </div>
                </div>
              )}

            </CardHeader>
            <CardContent className="p-6 bg-gray-800 text-gray-100 rounded-b-xl"> {/* Matched CardContent styling */}
              {account && userData?.isRegistered ? (
                <div className="flex md:flex-row gap-6 items-start"> {/* Ensure flex-col for mobile */}
                  {/* Borrowing Section - Left Column */}
                  <div className="flex-1 w-full bg-gray-700/50 rounded-lg p-6 space-y-6"> {/* Increased space-y */}
                    <h3 className="text-xl font-semibold text-gray-100 flex items-center">
                      <HandCoins className="mr-2 h-6 w-6 text-teal-400" />
                      Request a Loan
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="loanAmount" className="text-gray-300">Loan Amount (AVAX)</Label>
                      <Input
                        id="loanAmount"
                        type="number"
                        className="bg-gray-700 border-gray-600 text-gray-100 focus:ring-primary" // Matched input styling
                        placeholder="e.g., 1"
                        value={loanAmount}
                        onChange={(
                          e: React.ChangeEvent<HTMLInputElement>
                        ) => setLoanAmount(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <Button
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold" // Matched button styling
                      onClick={handleRequestLoan}
                      disabled={isLoading || !loanAmount}
                    >
                      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Requesting...</> : <><Send className="mr-2 h-4 w-4" />Request Loan</>}
                    </Button>
                  </div>

                  {/* Active Loans Section - Right Column */}
                  <div className="flex-1 w-full bg-gray-700/50 rounded-lg p-6 space-y-6"> {/* Increased space-y */}
                    <h3 className="text-xl font-semibold text-gray-100 flex items-center">
                      <ListChecks className="mr-2 h-6 w-6 text-teal-400" />
                      Your Active Loans
                    </h3>
                    {isLoading && (
                      <p className="text-sm text-gray-400"> {/* Adjusted text color */}
                        Loading loans...
                      </p>
                    )}
                    {!isLoading && activeLoans.length === 0 && (
                      <p className="text-sm text-gray-400"> {/* Adjusted text color */}
                        <FileText className="inline mr-2 h-4 w-4" /> No active loans found.
                      </p>
                    )}
                    {!isLoading && activeLoans.length > 0 && (
                      <ul className="space-y-3">
                        {activeLoans.map((loan) => (
                          <li
                            key={loan.loanId.toString()}
                            className="p-4 border border-gray-600 rounded-md bg-gray-750 text-sm text-gray-300 space-y-1.5" // Adjusted list item styling
                          >
                            <p className="flex items-center">
                              <Hash className="mr-2 h-4 w-4 text-teal-400" />
                              <strong className="text-gray-200">Loan ID:</strong>{" "}
                              {loan.loanId.toString()}
                            </p>
                            <p className="flex items-center">
                              <Coins className="mr-2 h-4 w-4 text-teal-400" />
                              <strong className="text-gray-200">Amount:</strong>{" "}
                              {ethers.formatEther(loan.amount)} AVAX
                            </p>
                            <p className="flex items-center">
                              <Percent className="mr-2 h-4 w-4 text-teal-400" />
                              <strong className="text-gray-200">Interest Rate:</strong>{" "}
                              {/* {loan.interestRate.toString()}% */}
                               {(Number(loan.interestRate) / 100).toFixed(2)}%

                            </p>
                            <p className="flex items-center">
                              <Coins className="mr-2 h-4 w-4 text-teal-400" />
                              <strong className="text-gray-200">Repayment Amount:</strong>{" "}
                              {ethers.formatEther(loan.repaymentAmount)}{" "}
                              AVAX
                            </p>
                            <p className="flex items-center">
                              <Info className="mr-2 h-4 w-4 text-teal-400" />
                              <strong className="text-gray-200">Status:</strong>{" "}
                              <span
                                className={`font-semibold ${
                                  loan.status === 1 // Approved / Active
                                    ? "text-green-400" 
                                    : loan.status === 3 // Defaulted
                                    ? "text-red-400"   
                                    : "text-yellow-300" 
                                }`}
                              >
                                {getLoanStatusString(loan.status)}
                              </span>
                            </p>
                            <p className="flex items-center">
                              <CalendarDays className="mr-2 h-4 w-4 text-teal-400" />
                              <strong className="text-gray-200">Requested:</strong>{" "}
                              {new Date(
                                Number(loan.requestedTimestamp) * 1000
                              ).toLocaleDateString()}
                            </p>
                            {loan.status === 1 && // Approved / Active
                              loan.lender !== ethers.ZeroAddress && (
                                <p className="flex items-center">
                                  <UserIcon className="mr-2 h-4 w-4 text-teal-400" />
                                  <strong className="text-gray-200">Lender:</strong> {loan.lender}
                                </p>
                              )}
                            {loan.status === 1 && ( // Approved / Active
                              <p className="flex items-center">
                                <CalendarClock className="mr-2 h-4 w-4 text-teal-400" />
                                <strong className="text-gray-200">Repayment Deadline:</strong>{" "}
                                {new Date(
                                  Number(loan.repaymentDeadline) * 1000
                                ).toLocaleDateString()}
                              </p>
                            )}
                            {/* Repay Loan Button */}
                            {loan.status === 1 && ( // Only show for Approved / Active loans
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white border-green-700 hover:border-green-800"
                                onClick={() => handleRepayLoan(loan)}
                                disabled={repayingLoanId === loan.loanId || isLoading}
                              >
                                {repayingLoanId === loan.loanId ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Banknote className="mr-2 h-4 w-4" />
                                )}
                                Repay {ethers.formatEther(loan.repaymentAmount)} AVAX
                              </Button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                </div>
              ) : (
                <p className="text-center text-gray-400 py-8 flex items-center justify-center">
                  <Info className="mr-2 h-5 w-5" /> Please connect your wallet and register to access lending and borrowing features.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}