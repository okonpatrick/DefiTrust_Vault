
// 'use client';

// import { useState } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Slider } from '@/components/ui/slider';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { UserPlus, Zap, Coins } from 'lucide-react';
// import { toast } from 'sonner';
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";
// //import { useWeb3 } from '@/contexts/Web3Context';
// import { ethers } from 'ethers';

// interface Endorsee {
//   id: string; // address
//   name: string; // address or ENS
//   trustScore: number;
//   avatarUrl: string; // Can be generic
//   dataAiHint?: string;
// }

// interface UserEndorsementProps {
//   potentialEndorsees: Endorsee[];
//   refreshEndorsees: () => Promise<void>;
//   refreshUserData: () => Promise<void>;
// }

// export function UserEndorsement({ potentialEndorsees, refreshEndorsees, refreshUserData }: UserEndorsementProps) {
//   const { account, trustChainContract, isCorrectNetwork, setLoading: setWeb3Loading } = useWeb3();
//   const [selectedEndorsee, setSelectedEndorsee] = useState<Endorsee | null>(null);
//   const [stakeAmount, setStakeAmount] = useState<number>(1); // Min 1 AVAX, ensure UI matches contract logic
//   const [isEndorsing, setIsEndorsing] = useState(false);
//   //const { toast } = useToast();

//   const handleEndorse = async () => {
//     if (!selectedEndorsee || !trustChainContract || !account || !isCorrectNetwork) {
//       toast({
//         title: 'Error',
//         description: 'Cannot endorse. Check wallet connection, network, and selection.',
//         variant: 'destructive',
//       });
//       return;
//     }
//     if (stakeAmount <= 0) {
//         toast({ title: "Invalid Amount", description: "Stake amount must be greater than 0.", variant: "destructive" });
//         return;
//     }

//     setIsEndorsing(true);
//     setWeb3Loading(true);
//     try {
//       const stakeAmountWei = ethers.parseEther(stakeAmount.toString());
//       const tx = await trustChainContract.endorseUser(selectedEndorsee.id, { value: stakeAmountWei });
//       toast({ title: "Endorsement Pending", description: "Waiting for transaction confirmation..." });
//       await tx.wait();
//       toast({
//         title: 'Endorsement Successful!',
//         description: `You have staked ${stakeAmount} AVAX to endorse ${selectedEndorsee.name}.`,
//         className: 'border-accent bg-accent/10 text-accent-foreground',
//       });
//       setSelectedEndorsee(null);
//       setStakeAmount(1);
//       await refreshUserData(); // Refresh main user data (trust score, etc.)
//       await refreshEndorsees(); // Refresh list (maybe their scores changed)
//     } catch (error: any) {
//       console.error("Error endorsing user:", error);
//       const errorMessage = error.reason || error.data?.message || error.message || "Failed to endorse user.";
//       toast({ title: "Endorsement Failed", description: errorMessage, variant: "destructive" });
//     }
//     setIsEndorsing(false);
//     setWeb3Loading(false);
//   };

//   return (
//     <Card className="shadow-lg rounded-xl overflow-hidden" id="endorse">
//       <CardHeader className="bg-secondary p-6">
//         <div className="flex items-center justify-between">
//             <CardTitle className="text-2xl text-secondary-foreground flex items-center">
//                 <UserPlus className="mr-2 h-7 w-7 text-primary" />
//                 Endorse a User
//             </CardTitle>
//             <Zap className="h-8 w-8 text-accent" />
//         </div>
//         <CardDescription className="text-muted-foreground">
//           Stake AVAX to vouch for other users and boost their trust score. Your stake also contributes to the lending pool.
//         </CardDescription>
//       </CardHeader>
//       <CardContent className="p-6 space-y-6">
//         <div>
//           <h3 className="text-lg font-semibold mb-3 text-foreground">Potential Users to Endorse</h3>
//           {potentialEndorsees.length > 0 ? (
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//               {potentialEndorsees.map((endorsee) => (
//                 <Card
//                   key={endorsee.id}
//                   className={`cursor-pointer hover:shadow-xl transition-shadow duration-200 rounded-lg overflow-hidden ${
//                     selectedEndorsee?.id === endorsee.id ? 'ring-2 ring-accent' : 'ring-1 ring-border'
//                   }`}
//                   onClick={() => setSelectedEndorsee(endorsee)}
//                 >
//                   <CardContent className="p-4 flex flex-col items-center text-center">
//                     <Avatar className="w-16 h-16 mb-3 border-2 border-primary">
//                       <AvatarImage src={endorsee.avatarUrl} alt={endorsee.name} data-ai-hint={endorsee.dataAiHint} />
//                       <AvatarFallback>{endorsee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
//                     </Avatar>
//                     <p className="font-semibold text-foreground truncate w-full" title={endorsee.name}>{endorsee.name}</p>
//                     <p className="text-sm text-muted-foreground">Trust Score: {endorsee.trustScore}</p>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           ) : (
//             <p className="text-muted-foreground">No registered users currently available for endorsement (or you are the only one!).</p>
//           )}
//         </div>

//         {selectedEndorsee && (
//           <Card className="p-4 bg-background shadow-inner rounded-lg border border-primary/20">
//             <h4 className="text-md font-semibold mb-3 text-primary">
//               Endorse {selectedEndorsee.name}
//             </h4>
//             <div className="space-y-4">
//               <div className="flex items-center space-x-2">
//                 <Coins className="h-5 w-5 text-accent" />
//                 <Input
//                   type="number"
//                   value={stakeAmount}
//                   onChange={(e) => setStakeAmount(Math.max(0.1, parseFloat(e.target.value) || 0.1))} // Allow decimals, min 0.1
//                   min="0.1"
//                   step="0.1"
//                   className="w-24 text-center"
//                   aria-label="Stake amount in AVAX"
//                 />
//                 <span className="text-sm text-foreground">AVAX</span>
//               </div>
//               <Slider
//                 value={[stakeAmount]}
//                 onValueChange={(value) => setStakeAmount(value[0])}
//                 max={100} // Max stake amount for slider example
//                 step={0.1}
//                 aria-label="Stake amount slider"
//               />
//               <p className="text-xs text-muted-foreground">
//                 Staking {stakeAmount} AVAX. If {selectedEndorsee.name} defaults on a loan, a portion of your stake may be used (feature under development).
//               </p>
//               <AlertDialog>
//                 <AlertDialogTrigger asChild>
//                   <Button 
//                     className="w-full bg-accent text-accent-foreground hover:bg-accent/90 transition-colors" 
//                     size="lg"
//                     disabled={isEndorsing || !isCorrectNetwork}
//                     >
//                     <Zap className="mr-2 h-5 w-5" />
//                     {isEndorsing ? 'Endorsing...' : 'Confirm Endorsement'}
//                   </Button>
//                 </AlertDialogTrigger>
//                 <AlertDialogContent>
//                   <AlertDialogHeader>
//                     <AlertDialogTitle>Confirm Endorsement?</AlertDialogTitle>
//                     <AlertDialogDescription>
//                       You are about to stake {stakeAmount} AVAX to endorse {selectedEndorsee.name}. This action is subject to smart contract rules. Your stake will also be added to the general lending pool.
//                     </AlertDialogDescription>
//                   </AlertDialogHeader>
//                   <AlertDialogFooter>
//                     <AlertDialogCancel>Cancel</AlertDialogCancel>
//                     <AlertDialogAction onClick={handleEndorse} className="bg-accent text-accent-foreground hover:bg-accent/90">
//                       Proceed
//                     </AlertDialogAction>
//                   </AlertDialogFooter>
//                 </AlertDialogContent>
//               </AlertDialog>
//             </div>
//           </Card>
//         )}
//       </CardContent>
//     </Card>
//   );
// }
