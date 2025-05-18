
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, DollarSign, ShieldAlert, BarChart3, Info, Percent, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Keep if needed
//import { useWeb3 } from '@/contexts/Web3Context';
import { ethers } from 'ethers';

interface PoolStats {
  totalLiquidity: number; // In AVAX (ethers)
  apy: number; // Placeholder
  riskLevel: string; // Placeholder
  activeLoans: number; // Count
  availableToBorrow: number; // In AVAX (ethers)
}

interface LendingPoolInterfaceProps {
  poolStats: PoolStats | null;
  refreshPoolStats: () => Promise<void>;
  refreshUserData: () => Promise<void>; // To update user's loan history etc.
}

export function LendingPoolInterface({ poolStats, refreshPoolStats, refreshUserData }: LendingPoolInterfaceProps) {
  const { account, trustChainContract, isCorrectNetwork, setLoading: setWeb3Loading } = useWeb3();
  const [depositAmount, setDepositAmount] = useState<number>(1); // Default deposit amount
  const [borrowAmount, setBorrowAmount] = useState<number>(0.5); // Default borrow amount
  const [projectedEarnings, setProjectedEarnings] = useState<number>(0); // Stays as UI calculation

  const [isDepositing, setIsDepositing] = useState(false);
  const [isRequestingLoan, setIsRequestingLoan] = useState(false);

  //const { toast } = useToast();

  useEffect(() => {
    if (poolStats) {
      const earnings = (depositAmount * poolStats.apy) / 100;
      setProjectedEarnings(parseFloat(earnings.toFixed(2)));
    }
  }, [depositAmount, poolStats]);

  const handleAllocateCapital = async () => {
    if (!trustChainContract || !account || !isCorrectNetwork) {
      toast({ title: "Cannot Deposit", description: "Connect wallet to correct network.", variant: "destructive" });
      return;
    }
    if (depositAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Deposit amount must be positive.", variant: "destructive" });
      return;
    }
    setIsDepositing(true);
    setWeb3Loading(true);
    try {
      const depositAmountWei = ethers.parseEther(depositAmount.toString());
      const tx = await trustChainContract.depositCapital({ value: depositAmountWei });
      toast({ title: "Deposit Pending", description: "Waiting for transaction confirmation..." });
      await tx.wait();
      toast({
        title: 'Capital Allocated!',
        description: `You have successfully deposited ${depositAmount} AVAX.`,
        className: 'border-primary bg-primary/10 text-primary-foreground',
      });
      setDepositAmount(1); 
      await refreshPoolStats();
      await refreshUserData(); // User balances might be relevant if contract tracks deposits per user
    } catch (error: any) {
      console.error("Error depositing capital:", error);
      const errorMessage = error.reason || error.data?.message || error.message || "Failed to deposit capital.";
      toast({ title: "Deposit Failed", description: errorMessage, variant: "destructive" });
    }
    setIsDepositing(false);
    setWeb3Loading(false);
  };

  const handleRequestLoan = async () => {
     if (!trustChainContract || !account || !isCorrectNetwork) {
      toast({ title: "Cannot Request Loan", description: "Connect wallet to correct network.", variant: "destructive" });
      return;
    }
    if (borrowAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Loan amount must be positive.", variant: "destructive" });
      return;
    }
    setIsRequestingLoan(true);
    setWeb3Loading(true);
    try {
      const borrowAmountWei = ethers.parseEther(borrowAmount.toString());
      // Note: The contract requestLoan function does not take value, amount is a param
      const tx = await trustChainContract.requestLoan(borrowAmountWei);
      toast({ title: "Loan Request Pending", description: "Waiting for transaction confirmation..." });
      await tx.wait();
      // The contract might auto-approve, or emit an event. Here we assume it's requested.
      toast({
        title: 'Loan Requested!',
        description: `You have requested a loan of ${borrowAmount} AVAX. It might be auto-approved if conditions met.`,
        className: 'border-primary bg-primary/10 text-primary-foreground',
      });
      setBorrowAmount(0.5);
      await refreshPoolStats();
      await refreshUserData(); // Update user's active loans / trust score
    } catch (error: any) {
      console.error("Error requesting loan:", error);
      const errorMessage = error.reason || error.data?.message || error.message || "Failed to request loan.";
      toast({ title: "Loan Request Failed", description: errorMessage, variant: "destructive" });
    }
    setIsRequestingLoan(false);
    setWeb3Loading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(value);
  }

  if (!poolStats) {
    return (
      <Card className="shadow-lg rounded-xl overflow-hidden" id="lending-pool">
        <CardHeader className="bg-gradient-to-r from-teal-600 to-primary text-primary-foreground p-6">
           <CardTitle className="text-2xl flex items-center">
                <Landmark className="mr-2 h-7 w-7" />
                Lending Pool
            </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Loading lending pool data or connect wallet...</p>
        </CardContent>
      </Card>
    );
  }
  
  // Assuming contract provides fixed interest rate or it's a known constant
  const estimatedInterestRate = 7.0; // Example: 7% APR from contract constant DEFAULT_INTEREST_RATE = 700 basis points
  const estimatedRepaymentPeriod = "30 days"; // From contract constant LOAN_DURATION

  return (
    <Card className="shadow-lg rounded-xl overflow-hidden" id="lending-pool">
      <CardHeader className="bg-gradient-to-r from-teal-600 to-primary text-primary-foreground p-6">
        <div className="flex items-center justify-between">
            <CardTitle className="text-2xl flex items-center">
                <Landmark className="mr-2 h-7 w-7" />
                Lending Pool
            </CardTitle>
            <DollarSign className="h-8 w-8" />
        </div>
        <CardDescription className="text-primary-foreground/80">
          View pool statistics, contribute liquidity, or request a loan.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center">
            <BarChart3 className="mr-2 h-5 w-5 text-primary" />
            Pool Statistics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Total Liquidity', value: `${formatCurrency(poolStats.totalLiquidity)} AVAX`, icon: <DollarSign className="text-primary" /> },
              { label: 'Est. APY (Mock)', value: `${poolStats.apy}%`, icon: <Percent className="text-green-500" /> },
              { label: 'Risk Level (Mock)', value: poolStats.riskLevel, icon: <ShieldAlert className={poolStats.riskLevel === 'Low' ? 'text-green-500' : poolStats.riskLevel === 'Moderate' ? 'text-yellow-500' : 'text-red-500'} /> },
              { label: 'Total Loans (History)', value: formatCurrency(poolStats.activeLoans), icon: <TrendingUp className="text-primary" /> },
              { label: 'Available to Borrow', value: `${formatCurrency(poolStats.availableToBorrow)} AVAX`, icon: <DollarSign className="text-primary" /> },
            ].map((stat, index) => (
              <Card key={index} className="p-4 bg-secondary/30 rounded-lg shadow-sm">
                <div className="flex items-center text-sm text-muted-foreground mb-1">
                  {stat.icon}
                  <span className="ml-1.5">{stat.label}</span>
                </div>
                <p className="text-xl font-semibold text-foreground">{stat.value}</p>
              </Card>
            ))}
          </div>
        </div>

        <Card className="p-6 bg-background shadow-inner rounded-lg border border-primary/20">
          <h3 className="text-lg font-semibold mb-4 text-primary flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Allocate Capital (AVAX)
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                min="0.1"
                step="0.1"
                className="w-full"
                aria-label="Deposit amount in AVAX"
              />
            </div>
            <Slider
              value={[depositAmount]}
              onValueChange={(value) => setDepositAmount(value[0])}
              max={100} 
              step={0.1}
              aria-label="Deposit amount slider"
            />
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Min: 0.1 AVAX</span>
              <span>Max: 100 AVAX (slider)</span>
            </div>
            <div className="p-3 bg-secondary/50 rounded-md text-sm">
              <p className="flex items-center">
                <Info className="mr-2 h-4 w-4 text-primary" />
                Projected Annual Earnings (at mock APY): 
                <span className="font-semibold text-green-600 ml-1">{projectedEarnings} AVAX</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Note: APY is illustrative and subject to change. Past performance is not indicative of future results.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" 
                    size="lg"
                    disabled={isDepositing || !isCorrectNetwork || !account}
                >
                  {isDepositing ? 'Depositing...' : `Deposit ${depositAmount} AVAX`}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Deposit?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You are about to deposit {depositAmount} AVAX into the lending pool.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAllocateCapital} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Confirm Deposit
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Card>

        <Card className="p-6 bg-background shadow-inner rounded-lg border border-primary/20">
          <h3 className="text-lg font-semibold mb-4 text-blue-600 flex items-center"> {/* Changed text color for borrow section */}
            <DollarSign className="mr-2 h-5 w-5" />
            Borrow AVAX
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Available to Borrow from Pool:</p>
              <p className="text-xl font-semibold text-foreground">{formatCurrency(poolStats.availableToBorrow)} AVAX</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="borrow-amount" className="text-sm font-medium text-foreground">Loan Amount (AVAX)</label>
              <div className="flex items-center space-x-2">
                <Input
                  id="borrow-amount"
                  type="number"
                  value={borrowAmount}
                  onChange={(e) => setBorrowAmount(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  min="0.1"
                  step="0.1"
                  className="w-full"
                  aria-label="Borrow amount in AVAX"
                />
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                        className="bg-blue-600 text-white hover:bg-blue-700 transition-colors" /* Changed borrow button color */
                        size="lg"
                        disabled={isRequestingLoan || !isCorrectNetwork || !account}
                        >
                      {isRequestingLoan ? 'Requesting...' : 'Request Loan'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Loan Request?</AlertDialogTitle>
                      <AlertDialogDescription>
                        You are requesting a loan of {borrowAmount} AVAX. Estimated terms apply. Ensure you understand repayment obligations.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRequestLoan} className="bg-blue-600 text-white hover:bg-blue-700">Confirm Request</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <div className="p-3 bg-secondary/50 rounded-md text-sm">
              <h4 className="font-semibold mb-2 text-primary">Loan Terms (Estimate from Contract Rules)</h4>
              <p className="flex items-center text-muted-foreground mb-1">
                <Percent className="mr-2 h-4 w-4 text-primary" />
                Interest Rate: <span className="font-semibold text-blue-800 ml-1">{estimatedInterestRate}% (APR)</span>
              </p>
              <p className="flex items-center text-muted-foreground">
                <Info className="mr-2 h-4 w-4 text-primary" />
                Repayment Period: <span className="font-semibold text-blue-800 ml-1">{estimatedRepaymentPeriod}</span>
              </p>
               <p className="text-xs text-muted-foreground mt-2">
                Note: Actual loan approval and terms depend on your trust score and current pool conditions as per smart contract logic.
              </p>
            </div>
          </div>
        </Card>
      </CardContent>
    </Card>
  );
}
