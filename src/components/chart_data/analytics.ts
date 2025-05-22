// src/chart_data/analytics.ts

export const mockTvlData = [
  { date: 'Jan 24', tvl: 12000 }, { date: 'Feb 24', tvl: 15000 },
  { date: 'Mar 24', tvl: 13500 }, { date: 'Apr 24', tvl: 17000 },
  { date: 'May 24', tvl: 20000 }, { date: 'Jun 24', tvl: 22000 },
];

export const mockLoanVolumeData = [
  { month: 'Jan', requested: 500, approved: 400, repaid: 200 },
  { month: 'Feb', requested: 700, approved: 600, repaid: 350 },
  { month: 'Mar', requested: 600, approved: 500, repaid: 400 },
  { month: 'Apr', requested: 800, approved: 750, repaid: 500 },
  { month: 'May', requested: 750, approved: 700, repaid: 600 },
  { month: 'Jun', requested: 900, approved: 850, repaid: 700 },
];

export const mockUtilizationData = [
  { date: 'Jan 24', utilization: 30 }, { date: 'Feb 24', utilization: 45 },
  { date: 'Mar 24', utilization: 40 }, { date: 'Apr 24', utilization: 55 },
  { date: 'May 24', utilization: 50 }, { date: 'Jun 24', utilization: 60 },
];

export const mockActiveUsersData = [
  { name: 'Borrowers', value: 450 }, { name: 'Lenders', value: 200 }
];

export const PIE_CHART_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444']; // Teal, Green, Amber, Red