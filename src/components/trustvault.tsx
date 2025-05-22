//app/trustvault/page.tsx
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
import {
  mockTvlData,
  mockLoanVolumeData,
  mockUtilizationData,
  mockActiveUsersData,
  PIE_CHART_COLORS
} from '@/components/chart_data/analytics'; // Adjusted import path

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

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
  UserCheck, 
  Landmark,    
  HandCoins, 
  ListChecks,    
  Send,          
  Loader2,       
  FileText,      
  Hash,          
  Coins,         
  Percent,    
  CalendarDays,  
  User as UserIcon, 
  CalendarClock,
  Info,
  PiggyBank,
  Lock,          
  Banknote,      
  BarChart3,
  Activity, 
  Users, 
} from "lucide-react";

const CONTRACT_ADDRESS =
  import.meta.env.VITE_PUBLIC_CONTRACT_ADDRESS || "undefined";
const RPC_URL =
  import.meta.env.VITE_PUBLIC_DEFAULT_RPC_URL ||
  "https://api.avax-test.network/ext/bc/C/rpc";

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
  const [calculatedCollateral, setCalculatedCollateral] = useState<string>("0"); // Display calculated collateral
  const [repayingLoanId, setRepayingLoanId] = useState<bigint | null>(null);

  const [totalLiquidity, setTotalLiquidity] = useState<bigint | null>(null);
  const [isLoadingTotalLiquidity, setIsLoadingTotalLiquidity] = useState(false);


  const contractAbi = TrustChainABI;

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

  // Effect to calculate collateral whenever loanAmount changes
  useEffect(() => {
    if (loanAmount) {
      try {
        const amount = parseFloat(loanAmount);
        if (!isNaN(amount) && amount > 0) {
          // Collateral is loan amount + 30% interest = 130% of loan amount
          setCalculatedCollateral((amount * 1.3).toFixed(4)); // Display with 4 decimal places
        } else setCalculatedCollateral("0");
      } catch { setCalculatedCollateral("0"); }
    } else setCalculatedCollateral("0");
  }, [loanAmount]);

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
      // Calculate collateral amount (130% of loan amount)
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
      toast.error("Invalid Loan Amount", {
        description: "Please enter a valid positive number for the loan amount.",
      });
      setError("Invalid loan amount."); // Keep internal error state

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

      // Calculate the collateral amount (130% of loan amount) using BigInt for precision
      // amountWei is already validated and parsed from loanAmount
      const collateralFactorNumerator = 130n; // Represents 130%
      const collateralFactorDenominator = 100n; // Represents 100%
      const collateralAmountWei = (amountWei * collateralFactorNumerator) / collateralFactorDenominator;

      const collateralDisplay = ethers.formatEther(collateralAmountWei); // For the toast message

      toast.info("Processing Loan Request", {
        description: `Requesting loan of ${loanAmount} AVAX, locking ${collateralDisplay} AVAX as collateral. Please confirm in your wallet.`,
      });

      // Call the contract function, sending the collateral amount as value
      const tx = await contract.requestLoan(amountWei, { value: collateralAmountWei });
      await tx.wait();

      toast.success("Loan Requested Successfully!", { description: `Your loan request for ${loanAmount} AVAX is being processed.` });
      fetchActiveLoans(); // Refresh active loans list
    } catch (e: unknown) {
      // Log the full error object for debugging purposes
      console.error("Loan request failed (raw error object):", JSON.stringify(e, null, 2));

      let detailedErrorMessage = "An unexpected error occurred while requesting the loan.";
      let errorTitle = "Loan Request Failed";

      if (typeof e === 'object' && e !== null) {
        if ('reason' in e && typeof e.reason === 'string' && e.reason) {
            detailedErrorMessage = e.reason;
        } else if ('data' in e && e.data && typeof e.data === 'object' && 'message' in e.data && typeof e.data.message === 'string' && e.data.message) {
            // Common for Hardhat node detailed errors
            detailedErrorMessage = e.data.message;
        } else if ('error' in e && e.error && typeof e.error === 'object' && 'message' in e.error && typeof e.error.message === 'string' && e.error.message) {
            // Another common nesting
            detailedErrorMessage = e.error.message;
        } else if ('message' in e && typeof e.message === 'string' && e.message) {
            detailedErrorMessage = e.message;
        }
      } else if (typeof e === 'string') {
        detailedErrorMessage = e;
      }

      // Normalize common error messages from contracts
      if (detailedErrorMessage.toLowerCase().includes("trust score too low")) {
        errorTitle = "Loan Request Failed: Trust Score Too Low";
        detailedErrorMessage = "Your current trust score does not meet the minimum requirement for this loan.";
        setError("Trust score too low.");
      } else if (detailedErrorMessage.toLowerCase().includes("user not registered")) {
        errorTitle = "Loan Request Failed: User Not Registered";
        detailedErrorMessage = "You must be registered to request a loan. Please register first.";
        setError("User not registered.");
      } else if (detailedErrorMessage.toLowerCase().includes("incorrect collateral") || detailedErrorMessage.toLowerCase().includes("collateral amount")) {
        errorTitle = "Loan Request Failed: Collateral Issue";
        detailedErrorMessage = "The collateral amount sent seems incorrect or mismatched with the loan amount. Please verify and try again.";
        setError("Incorrect collateral amount.");
      } else if (detailedErrorMessage.toLowerCase().includes("insufficient pool liquidity") || detailedErrorMessage.toLowerCase().includes("insufficient liquidity")) {
        errorTitle = "Loan Request Failed: Insufficient Liquidity";
        detailedErrorMessage = "The pool does not have enough liquidity for this loan amount at the moment. Try a smaller amount or try again later.";
        setError("Insufficient pool liquidity.");
      } else if (detailedErrorMessage.toLowerCase().includes("caller is not the borrower")) {
        errorTitle = "Action Denied";
        detailedErrorMessage = "This action can only be performed by the borrower.";
        setError("Caller is not the borrower.");
      }
      // Add more specific checks based on your contract's known revert reasons
      else {
        // For generic errors or if specific parsing above didn't catch it
        setError(detailedErrorMessage);
      }

      toast.error(errorTitle, {
        description: detailedErrorMessage,
      });

    } finally {
      setIsLoading(false);
      setLoanAmount(""); // Clear input on success or failure
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
      <div className="flex gap-6 items-stretch mx-4 md:mx-16 bg-gray-900 p-6">
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
                      <HandCoins className="mr-2 h-6 w-6 text-teal-300" />
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

                    {/* Display Calculated Collateral */}
                    {parseFloat(calculatedCollateral) > 0 && (
                      <div className="p-3 bg-gray-600/50 rounded-md text-sm text-gray-200 flex items-center justify-between">
                        <div className="flex items-center">
                           <Lock className="mr-2 h-4 w-4 text-yellow-400" />
                           <span className="font-medium">Required Collateral:</span>
                        </div>
                        <span className="font-semibold text-yellow-300">{calculatedCollateral} AVAX</span>
                      </div>
                    )}

                    {/* Collateral Warning */}
                    <div className="p-3 bg-red-600/30 rounded-md text-sm text-red-200 flex items-start">
                       <ShieldCheck className="mr-2 h-5 w-5 text-red-300 flex-shrink-0" />
                       <p>
                         By requesting this loan, you agree to lock {calculatedCollateral} AVAX as collateral. If the loan is not repaid by the deadline, this collateral may be claimed by the protocol.
                       </p>
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
                      <ListChecks className="mr-2 h-6 w-6 text-teal-300" />
                      Your Active Loans
                    </h3>
                    {isLoading && (
                      <p className="text-sm text-gray-400">
                        Loading loans...
                      </p>
                    )}
                    {!isLoading && activeLoans.length === 0 && (
                      <p className="text-sm text-gray-400">
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
                              <Hash className="mr-2 h-4 w-4 text-teal-300" />
                              <strong className="text-gray-200">Loan ID:</strong>{" "}
                              {loan.loanId.toString()}
                            </p>
                            <p className="flex items-center">
                              <Coins className="mr-2 h-4 w-4 text-teal-300" />
                              <strong className="text-gray-200">Amount:</strong>{" "}
                              {ethers.formatEther(loan.amount)} AVAX
                            </p>
                            <p className="flex items-center">
                              <Percent className="mr-2 h-4 w-4 text-teal-300" />
                              <strong className="text-gray-200">Interest Rate:</strong>{" "}
                              {/* {loan.interestRate.toString()}% */}
                               {(Number(loan.interestRate) / 100).toFixed(2)}%

                            </p>
                            <p className="flex items-center">
                              <Coins className="mr-2 h-4 w-4 text-teal-300" />
                              <strong className="text-gray-200">Repayment Amount:</strong>{" "}
                              {ethers.formatEther(loan.repaymentAmount)}{" "}
                              AVAX
                            </p>
                            <p className="flex items-center">
                              <Info className="mr-2 h-4 w-4 text-teal-400" />
                              <strong className="text-gray-200">Status:</strong>{" "}
                              <span // Added span for conditional text color
                                className={`font-semibold ${
                                  loan.status === 1
                                    ? "text-green-400" 
                                    : loan.status === 3
                                    ? "text-red-400"   
                                    : "text-yellow-300" 
                                }`}
                              >
                                {getLoanStatusString(loan.status)}
                              </span>
                            </p>
                            <p className="flex items-center">
                              <CalendarDays className="mr-2 h-4 w-4 text-teal-300" />
                              <strong className="text-gray-200">Requested:</strong>{" "}
                              {new Date(
                                Number(loan.requestedTimestamp) * 1000
                              ).toLocaleDateString()}
                            </p>
                            {loan.status === 1 &&
                              loan.lender !== ethers.ZeroAddress && ( // Only show lender if loan is active and lender is not zero address
                                <p className="flex items-center">
                                  <UserIcon className="mr-2 h-4 w-4 text-teal-400" />
                                  <strong className="text-gray-200">Lender:</strong> {loan.lender}
                                </p>
                              )}
                            {loan.status === 1 && (
                              <p className="flex items-center">
                                <CalendarClock className="mr-2 h-4 w-4 text-teal-300" />
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

      {/* Protocol Analytics Section */}
      <motion.div
        className="mx-4 md:mx-16 mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }} // Delay after lending pool
      >
        <Card className="bg-gray-800 border-gray-700 shadow-lg rounded-xl">
          <CardHeader className="bg-gradient-to-r from-primary to-teal-600 p-6 text-gray-100 rounded-t-xl">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold flex items-center">
                <BarChart3 className="mr-3 h-7 w-7" /> {/* Using BarChart3 for general analytics */}
                Protocol Analytics & Insights
              </CardTitle>
            </div>
            <CardDescription className="text-gray-200">
              Overview of the platform's activity and financial health. (Mock Data)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TVL Over Time Chart */}
            <Card className="bg-gray-700/60 border-gray-600 shadow-md rounded-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-100 flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-teal-300" />
                  Total Value Locked (TVL)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockTvlData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="#9ca3af" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `${value/1000}k`} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '0.5rem', color: '#e5e7eb' }} itemStyle={{ color: '#e5e7eb' }}/>
                    <Line type="monotone" dataKey="tvl" stroke="#2dd4bf" strokeWidth={2} dot={{ r: 4, fill: "#2dd4bf" }} activeDot={{ r: 6 }} name="TVL (AVAX)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Loan Volume Dynamics Chart */}
            <Card className="bg-gray-700/60 border-gray-600 shadow-md rounded-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-100 flex items-center">
                  <Landmark className="mr-2 h-5 w-5 text-teal-300" /> {/* Using Landmark for volume */}
                  Loan Volume Dynamics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockLoanVolumeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="#9ca3af" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '0.5rem' }} itemStyle={{ color: '#e5e7eb' }}/>
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#d1d5db' }} />
                    <Bar dataKey="requested" fill="#0ea5e9" name="Requested (AVAX)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="approved" fill="#2dd4bf" name="Approved (AVAX)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="repaid" fill="#10b981" name="Repaid (AVAX)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Liquidity Utilization Rate Chart */}
            <Card className="bg-gray-700/60 border-gray-600 shadow-md rounded-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-100 flex items-center">
                  <Activity className="mr-2 h-5 w-5 text-teal-300" />
                  Liquidity Utilization Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockUtilizationData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} stroke="#9ca3af" />
                    <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} unit="%" domain={[0, 100]} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '0.5rem' }} itemStyle={{ color: '#e5e7eb' }} formatter={(value: number) => `${value}%`} />
                    <Area type="monotone" dataKey="utilization" stroke="#818cf8" fill="#818cf8" fillOpacity={0.3} name="Utilization Rate" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Active User Distribution Chart */}
            <Card className="bg-gray-700/60 border-gray-600 shadow-md rounded-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-100 flex items-center">
                  <Users className="mr-2 h-5 w-5 text-teal-300" />
                  Active User Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockActiveUsersData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {mockActiveUsersData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '0.5rem' }} itemStyle={{ color: '#e5e7eb' }}/>
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#d1d5db', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}