
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Activity, ImageIcon, Users, TrendingUp, CheckCircle, XCircle, ShieldCheck, UserCheck } from 'lucide-react';
import type { FC } from 'react';

// Updated to match the structure from page.tsx
interface DisplayableScoreData {
  score: number;
  onChainActivity: Array<{ metric: string; value: string; icon: string }>;
  endorsements: number;
  loanHistory: {
    completed: number;
    defaulted: number;
  };
  isRegistered: boolean; // Added for completeness, though component might only show if registered
}

interface TrustScoreDisplayProps {
  scoreData: DisplayableScoreData | null; // Allow null if data is not yet loaded or user not registered
}

const IconMap: Record<string, FC<{ className?: string }>> = {
  Activity: Activity,
  ImageIcon: ImageIcon,
  Users: Users,
  TrendingUp: TrendingUp,
  CheckCircle: CheckCircle,
  XCircle: XCircle,
  ShieldCheck: ShieldCheck,
  UserCheck: UserCheck,
};

export function TrustScoreDisplay({ scoreData }: TrustScoreDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 700) return 'text-green-500'; // Adjusted threshold
    if (score >= 400) return 'text-yellow-500'; // Adjusted threshold
    return 'text-red-500';
  };

  if (!scoreData || !scoreData.isRegistered) {
    return (
      <Card className="shadow-lg rounded-xl overflow-hidden" id="trust-score">
        <CardHeader className="bg-gradient-to-r from-primary to-teal-600 text-primary-foreground p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Your Trust Score</CardTitle>
            <ShieldCheck className="h-8 w-8" />
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            {scoreData === null ? "Loading score data..." : "Please register or connect wallet to view your trust score."}
          </p>
        </CardContent>
      </Card>
    );
  }


  return (
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
          <p className={`text-7xl font-bold ${getScoreColor(scoreData.score)}`}>
            {scoreData.score}
          </p>
          <Progress value={(scoreData.score / 1000) * 100} className="mt-2 h-3" />
          <p className="text-sm text-muted-foreground mt-1">Max Score: 1000 (example)</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center">
            <Activity className="mr-2 h-5 w-5 text-primary" />
            On-Chain Activity (Illustrative)
          </h3>
          <ul className="space-y-2">
            {scoreData.onChainActivity.map((activity, index) => {
              const IconComponent = IconMap[activity.icon] || Activity;
              return (
                <li key={index} className="flex items-center justify-between text-sm p-2 bg-secondary/50 rounded-md">
                  <div className="flex items-center">
                    <IconComponent className="mr-2 h-4 w-4 text-primary" />
                    <span>{activity.metric}</span>
                  </div>
                  <span className="font-medium text-foreground">{activity.value}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
            <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center justify-center">
                    <UserCheck className="mr-1 h-4 w-4 text-primary" />
                    Endorsements Recv.
                </h4>
                <p className="text-2xl font-semibold text-foreground">{scoreData.endorsements}</p>
            </div>
            <div>
                 <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center justify-center">
                    <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                    Loans Completed
                </h4>
                <p className="text-2xl font-semibold text-foreground">{scoreData.loanHistory.completed}</p>
            </div>
            <div>
                 <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center justify-center">
                    <XCircle className="mr-1 h-4 w-4 text-red-500" />
                    Loans Defaulted
                </h4>
                <p className="text-2xl font-semibold text-foreground">{scoreData.loanHistory.defaulted}</p>
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
  );
}
