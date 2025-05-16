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
    <div className="min-h-screen p-8 bg-gray-50">
      <motion.div
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-6">
          <CardContent className="space-y-4">
            <h1 className="text-2xl font-bold">DeFi Trust Vault</h1>
            <p>Decentralized, reputation-based micro-lending on Avalanche.</p>
            {error && <p className="text-sm text-red-500 bg-red-100 p-2 rounded">{error}</p>}

            {account ? (
              <>
                <p className="text-sm text-gray-600">Connected as: {account}</p>
                <Button onClick={fetchUser} disabled={isLoading || !CONTRACT_ADDRESS}>
                  {isLoading ? 'Fetching...' : 'Fetch Profile'}
                </Button>
                {userData ? (
                  <div className="text-sm text-gray-800">
                    <p>Trust Score: {userData.trustScore.toString()}</p>
                    <p>Loans Completed: {userData.loansCompleted.toString()}</p>
                    <p>Loans Defaulted: {userData.loansDefaulted.toString()}</p>
                    <p>Staked On: {ethers.formatEther(userData.totalStakedOnUser)} AVAX</p>
                  </div>
                ) : (
                  !isLoading && <p className="text-sm text-gray-500">No user data found. You might need to register.</p>
                )}
              </>
            ) : (
              <Button onClick={connectWallet} disabled={isLoading || !CONTRACT_ADDRESS}>
                {isLoading ? 'Connecting...' : 'Connect Wallet'}
              </Button>
            )}
            {account && (!userData || !userData.isRegistered) && (
              <Button variant="secondary" onClick={registerUser} disabled={isLoading || !CONTRACT_ADDRESS}>
                {isLoading ? 'Registering...' : 'Register'}
              </Button>
            )}
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
  )
}
