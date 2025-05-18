// app/trustvault/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { ethers } from 'ethers'
import TrustChainABI from '@/abis/TrustChain.json'
import { Input } from '@/components/ui/input' // Assuming you have shadcn Input component
import { Label } from '@/components/ui/label' // Assuming you have shadcn Label component
import { toast } from "sonner";


import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrustScoreDisplay } from '@/components/trust-score-display';
import { UserEndorsement } from '@/components/user-endorsement';
import { LendingPoolInterface } from '@/components/lending-pool-interface';
import { Separator } from '@/components/ui/separator';
//import { useWeb3 } from '@/contexts/Web3Context';
//import { useToast } from '@/hooks/use-toast';
import type { BigNumberish } from 'ethers'; // For type safety with ethers
import { ErrorDecoder } from 'ethers-decode-error'


import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity, ImageIcon, Users, TrendingUp, CheckCircle, XCircle, ShieldCheck, UserCheck } from 'lucide-react';
import type { FC } from 'react';


const CONTRACT_ADDRESS = import.meta.env.VITE_PUBLIC_CONTRACT_ADDRESS || 'undefined'
const RPC_URL = import.meta.env.VITE_PUBLIC_DEFAULT_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc'
// You might want to add VITE_FUJI_CHAIN_ID for network checks
// const EXPECTED_CHAIN_ID = import.meta.env.VITE_FUJI_CHAIN_ID;

interface UserData {
  trustScore: bigint
  loansCompleted: bigint
  loansDefaulted: bigint
  totalStakedOnUser: bigint
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

//pasting starts here
  // Types matching contract structures (or subset for display)
interface UserContractData {
  userAddress: string;
  trustScore: BigNumberish;
  endorsementsReceivedCount: BigNumberish;
  totalStakedOnUser: BigNumberish;
  loansCompleted: BigNumberish;
  loansDefaulted: BigNumberish;
  isRegistered: boolean;
}

interface DisplayableScoreData {
  score: number;
  onChainActivity: Array<{ metric: string; value: string; icon: string }>; // Keep this structure for UI
  endorsements: number;
  loanHistory: {
    completed: number;
    defaulted: number;
  };
  isRegistered: boolean;
}

interface PoolStats {
  totalLiquidity: number; // In AVAX (ethers)
  apy: number; // Placeholder
  riskLevel: string; // Placeholder
  activeLoans: number; // Count
  availableToBorrow: number; // In AVAX (ethers)
}

interface Endorsee {
  id: string; // address
  name: string; // for display, could be address or ENS if resolved
  trustScore: number;
  avatarUrl: string; // keep for UI, can be generic
  dataAiHint?: string;
}
//pasted stops here

  // Helper to convert loan status number to a readable string
const getLoanStatusString = (status: number): string => {
    switch (status) {
      case 0: return 'Requested';
      case 1: return 'Approved / Active';
      case 2: return 'Repaid';
      case 3: return 'Defaulted';
      case 4: return 'Cancelled';
      default: return 'Unknown';
    }
  }

export default function TrustVaultPage() {
  const [account, setAccount] = useState<string | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
    const [activeLoans, setActiveLoans] = useState<LoanData[]>([]);

    // State for input fields
  const [endorseeAddress, setEndorseeAddress] = useState('');
  const [endorseAmount, setEndorseAmount] = useState(''); // Stored as string, converted to BigInt/Wei later
  const [loanAmount, setLoanAmount] = useState(''); // Stored as string, converted to BigInt/Wei later

  const contractAbi = TrustChainABI.abi || TrustChainABI



  //paste here;
   //const { account, trustChainContract, isCorrectNetwork, setLoading: setWeb3Loading } = useWeb3();
  const errorDecoder = ErrorDecoder.create()
  const [userContractData, setUserContractData] = useState<UserContractData | null>(null);
  const [displayScoreData, setDisplayScoreData] = useState<DisplayableScoreData | null>(null);
  const [lendingPoolStats, setLendingPoolStats] = useState<PoolStats | null>(null);
  const [potentialEndorsees, setPotentialEndorsees] = useState<Endorsee[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUserNewlyRegistered, setIsUserNewlyRegistered] = useState(false);


//   fetchPotentialEndorsees = async () => {
//   return(<></>)
// }

// fetchUserData = async () => {
//   return(<></>)
// } 
// fetchPoolData = async () => {
//   return(<></>)
// }
//stops here

  useEffect(() => {
    if (!CONTRACT_ADDRESS || CONTRACT_ADDRESS === 'undefined') {
      console.error('VITE_PUBLIC_CONTRACT_ADDRESS is not set in .env file')
      setError('Missing contract address configuration.')
    }
  }, [])

  async function connectWallet() {
    setError(null)
    setIsLoading(true)
    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed.')
      }
      const provider = new ethers.BrowserProvider(window.ethereum)
      const accounts = await provider.send('eth_requestAccounts', [])
      setAccount(accounts[0])
      const newSigner = await provider.getSigner()
      setSigner(newSigner)
    } catch (e: any) {
      setError(e.message || 'Failed to connect wallet.')
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchUser() {
    if (!account || !CONTRACT_ADDRESS) {
      setError('Please connect wallet or set contract address.')
      return
    }
    setError(null)
    setIsLoading(true)
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, provider)
      const user = await contract.getUser(account)
      setUserData(user)
    } catch (e: any) {
      // Check if the error is "User not registered"
      if (e.message && e.message.includes("User not registered")) {
        console.log("User not registered, showing registration button")
        // Clear error since this is an expected state for new users
        setError(null)
      } else {
        setError(e.message || 'Failed to fetch user.')
      }
      setUserData(null)
    } finally {
      setIsLoading(false)
    }
  }

  async function registerUser() {
    if (!signer || !CONTRACT_ADDRESS) {
      setError('Please connect wallet or set contract address.')
      return
    }
    setError(null)
    setIsLoading(true)
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer)
      const tx = await contract.registerUser()
      await tx.wait()
      await fetchUser()
    } catch (e: any) {
      setError(e.message || 'Failed to register.')
    } finally {
      setIsLoading(false)
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
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, readOnlyProvider);

      const loanIds: bigint[] = await contract.getActiveLoansForUser(account);
      const loanDetails: LoanData[] = [];

      for (const loanId of loanIds) {
        const loan: LoanData = await contract.getLoan(loanId);
        
           loanDetails.push(loan);
      }
      setActiveLoans(loanDetails);

    } catch (e: any) {
      setError(e.message || 'Failed to fetch active loans.');
      console.error(e);
      setActiveLoans([]); // Clear old data on error
    }
    setIsLoading(false);
  }

  async function handleEndorseUser() {
    if (!signer || !CONTRACT_ADDRESS) {
      setError('Please connect wallet or ensure contract address is set.');
      return;
    }
    if (!ethers.isAddress(endorseeAddress)) {
      setError('Invalid endorsee address.');
      return;
    }
    if (endorseeAddress.toLowerCase() === account?.toLowerCase()) {
       setError('Cannot endorse yourself.');
       return;
    }
    let amountWei;
    try {
      amountWei = ethers.parseEther(endorseAmount);
      if (amountWei <= 0n) throw new Error("Amount must be positive.");
    } catch (e: any) {
      setError('Invalid stake amount. Please enter a positive number.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer);
      const tx = await contract.endorseUser(endorseeAddress, { value: amountWei });
      await tx.wait();
      setError('User endorsed successfully!'); // Use error state for success message temporarily
      setEndorseeAddress(''); // Clear input
      setEndorseAmount(''); // Clear input
      fetchUser(); // Refresh user data (trust score, total staked)
    } catch (e: any) {
      setError(e.message || 'Failed to endorse user.');
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
  }, [account])

  async function handleRequestLoan() {
    if (!signer || !CONTRACT_ADDRESS) {
      setError('Please connect wallet or ensure contract address is set.');
      return;
    }

    let amountWei;
    try {
      amountWei = ethers.parseEther(loanAmount);
      if (amountWei <= 0n) { // Use 0n for BigInt comparison
        setError('Loan amount must be a positive number.');
        return;
      }
    } catch (e) {
      setError('Invalid loan amount. Please enter a valid number.');
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi, signer);
      const tx = await contract.requestLoan(amountWei);
      await tx.wait();
      setError('Loan requested successfully!'); // Using setError for success message for consistency
      setLoanAmount(''); // Clear input
      fetchActiveLoans(); // Refresh active loans list
      // Optionally, refresh user data if it changes upon loan request
      // fetchUser(); 
    } catch (e: unknown) {
         // Log the full error object for debugging purposes
      console.error("Loan request failed:", e);

      if (typeof e === 'object' && e !== null && 'reason' in e && typeof e.reason === 'string' && e.reason.includes("Trust score too low")) {
        // Use a single, more descriptive sonner toast for this specific error
        toast.error("Loan Request Failed: Trust score too low", {
          description: "Your current trust score does not meet the minimum requirement for this loan.",
        });
        // You might want to clear the general error if the toast is sufficient
        // setError(null);
      } else if (e instanceof Error) {
        setError(e.message || 'An unexpected error occurred while requesting the loan.');
      } else {
        setError('An unknown error occurred while requesting the loan.');
      }
    } finally {
      setIsLoading(false);
    }
  }
  
  return (
    <>
     <main className="flex-grow container mx-auto px-4 py-8">
        {account && !displayScoreData?.isRegistered && !isUserNewlyRegistered && (
          <Card className="mb-8 p-6 bg-card shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Welcome to TrustChain!</CardTitle>
              <CardDescription>
                To participate in lending, borrowing, and endorsements, please register your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button disabled={isRegistering} size="lg">
                {isRegistering ? 'Registering...' : 'Register Your Account'}
              </Button>
            </CardContent>
          </Card>
        )}

        {(!account) && (
           <Card className="mb-8 p-6 bg-card shadow-lg rounded-xl text-center">
            <CardHeader>
              <CardTitle>Connect to TrustChain</CardTitle>
              <CardDescription>
                Please connect your wallet and ensure you are on the Avalanche Fuji Testnet to use the platform.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {displayScoreData && lendingPoolStats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
              <TrustScoreDisplay scoreData={displayScoreData} />
            </div>
            <div className="md:col-span-2 space-y-8">
              {/* <UserEndorsement potentialEndorsees={potentialEndorsees} refreshEndorsees={fetchPotentialEndorsees} refreshUserData={fetchUserData} /> */}
              <Separator />
              {/* <LendingPoolInterface poolStats={lendingPoolStats} refreshPoolStats={fetchPoolData} refreshUserData={fetchUserData}/> */}
            </div>
          </div>
        ) : account && displayScoreData?.isRegistered ? (
          <div className="text-center py-10">
            <p className="text-xl text-muted-foreground">Loading TrustChain data...</p>
            {/* You can add a spinner here */}
            
          </div>
        ) : <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <TrustScoreDisplay scoreData={displayScoreData} />
        </div>
        <div className="md:col-span-2 space-y-8">
          {/* <UserEndorsement potentialEndorsees={potentialEndorsees} refreshEndorsees={fetchPotentialEndorsees} refreshUserData={fetchUserData} /> */}
          <Separator />
          {/* <LendingPoolInterface poolStats={lendingPoolStats} refreshPoolStats={fetchPoolData} refreshUserData={fetchUserData}/> */}
        </div>
      </div>}
      </main>











 <Card className="shadow-lg rounded-xl overflow-hidden" id="trust-score">
      <CardHeader className="bg-gradient-to-r from-primary to-teal-600 text-primary-foreground p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">Your Trust Score</CardTitle>
          <ShieldCheck className="h-8 w-8" />
        </div>
        <CardDescription className="text-primary-foreground/80">
          Based on your on-chain activity and endorsements.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="text-center">
          <p className={`text-7xl font-bold`}>
            scoreData.score
          </p>
          <Progress className="mt-2 h-3" />
          <p className="text-sm text-muted-foreground mt-1">Max Score: 1000 (example)</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center">
            <Activity className="mr-2 h-5 w-5 text-primary" />
            On-Chain Activity (Illustrative)
          </h3>
          <ul className="space-y-2">
            
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
            <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center justify-center">
                    <UserCheck className="mr-1 h-4 w-4 text-primary" />
                    Endorsements Recv.
                </h4>
                <p className="text-2xl font-semibold text-foreground">scoreData.endorsements</p>
            </div>
            <div>
                 <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center justify-center">
                    <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                    Loans Completed
                </h4>
                <p className="text-2xl font-semibold text-foreground">scoreData.loanHistory.completed</p>
            </div>
            <div>
                 <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center justify-center">
                    <XCircle className="mr-1 h-4 w-4 text-red-500" />
                    Loans Defaulted
                </h4>
                <p className="text-2xl font-semibold text-foreground">scoreData.loanHistory.defaulted</p>
            </div>
             <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="cursor-help">
                            <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center justify-center">
                                <TrendingUp className="mr-1 h-4 w-4 text-primary" />
                                Score Factors
                            </h4>
                            <p className="text-xs text-muted-foreground">Hover to see</p>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-card text-card-foreground border shadow-lg rounded-md p-3">
                        <p className="text-sm">Scores are dynamic and improve with positive on-chain behavior, successful loan repayments, and community endorsements.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
      </CardContent>
    </Card>




















    <div className="min-h-screen p-8 bg-gray-50">
      <motion.div
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-6">
          <CardContent className="space-y-4">
           
            {/* Endorsement Section */}
            {account && userData?.isRegistered && (
              <Card className="p-4 mt-6">
                 <CardContent className="space-y-4">
                  <h3 className="text-lg font-semibold">Endorse a User</h3>
                   <div className="space-y-2">
                     <Label htmlFor="endorseeAddress">Endorsee Address</Label>
                     <Input
                       id="endorseeAddress"
                       type="text"
                       placeholder="0x..."
                       value={endorseeAddress}
                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndorseeAddress(e.target.value)}
                       disabled={isLoading}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="endorseAmount">Stake Amount (AVAX)</Label>
                     <Input
                       id="endorseAmount"
                       type="number"
                       placeholder="e.g., 0.1"
                       value={endorseAmount}
                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndorseAmount(e.target.value)}
                       disabled={isLoading}
                     />
                   </div>
                   <Button onClick={handleEndorseUser} disabled={isLoading || !endorseeAddress || !endorseAmount}>
                     {isLoading ? 'Endorsing...' : 'Endorse User'}
                   </Button>
                 </CardContent>
              </Card>
            )}

            {/* Borrowing Section */}
             {account && userData?.isRegistered && (
              <Card className="p-4 mt-6">
                 <CardContent className="space-y-4">
                  <h3 className="text-lg font-semibold">Request a Loan</h3>
                   <div className="space-y-2">
                     <Label htmlFor="loanAmount">Loan Amount (AVAX)</Label>
                     <Input
                       id="loanAmount"
                       type="number"
                       placeholder="e.g., 1"
                       value={loanAmount}
                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoanAmount(e.target.value)}
                       disabled={isLoading}
                     />
                   </div>
                   <Button onClick={handleRequestLoan} disabled={isLoading || !loanAmount}>
                     {isLoading ? 'Requesting...' : 'Request Loan'}
                   </Button>
                 </CardContent>
              </Card>
            )}

            {/* Active Loans Section */}
            {account && userData?.isRegistered && (
              <Card className="p-4 mt-6">
                <CardContent className="space-y-4">
                  <h3 className="text-lg font-semibold">Your Active Loans</h3>
                  {/* TODO: Display active loans here */}
                  {isLoading && <p className="text-sm text-gray-500">Loading loans...</p>}
                  {!isLoading && activeLoans.length === 0 && (
                    <p className="text-sm text-gray-500">No active loans found.</p>
                  )}
                  {!isLoading && activeLoans.length > 0 && (
                    <ul className="space-y-3">
                      {activeLoans.map((loan) => (
                        <li key={loan.loanId.toString()} className="p-3 border rounded-md bg-gray-50 text-sm">
                          <p><strong>Loan ID:</strong> {loan.loanId.toString()}</p>
                          <p><strong>Amount:</strong> {ethers.formatEther(loan.amount)} AVAX</p>
                          <p><strong>Interest Rate:</strong> {loan.interestRate.toString()}%</p>
                          <p><strong>Repayment Amount:</strong> {ethers.formatEther(loan.repaymentAmount)} AVAX</p>
                          <p><strong>Status:</strong> <span className={`font-semibold ${loan.status === 1 ? 'text-green-600' : loan.status === 3 ? 'text-red-600' : 'text-yellow-600'}`}>{getLoanStatusString(loan.status)}</span></p>
                          <p><strong>Requested:</strong> {new Date(Number(loan.requestedTimestamp) * 1000).toLocaleDateString()}</p>
                          {loan.status === 1 && loan.lender !== ethers.ZeroAddress && <p><strong>Lender:</strong> {loan.lender}</p>}
                          {loan.status === 1 && <p><strong>Repayment Deadline:</strong> {new Date(Number(loan.repaymentDeadline) * 1000).toLocaleDateString()}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
               </CardContent>
              </Card>
             )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </>
  )
}
