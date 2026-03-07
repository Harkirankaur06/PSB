export const dashboardData = {
  portfolio: {
    totalValue: 428400,
    previousValue: 425600,
    changePercent: 0.65,
    changeAmount: 2800,
  },
  incomeVsExpenses: [
    { month: 'Jan', income: 4500, expenses: 2300 },
    { month: 'Feb', income: 5200, expenses: 2100 },
    { month: 'Mar', income: 4800, expenses: 2400 },
    { month: 'Apr', income: 5800, expenses: 2600 },
    { month: 'May', income: 6200, expenses: 2900 },
    { month: 'Jun', income: 5900, expenses: 2500 },
  ],
  assetAllocation: [
    { name: 'Stocks', value: 185600, percentage: 43 },
    { name: 'Bonds', value: 128200, percentage: 30 },
    { name: 'Real Estate', value: 85600, percentage: 20 },
    { name: 'Cash', value: 28800, percentage: 7 },
  ],
  investmentGrowth: [
    { month: 'Jan', value: 400000 },
    { month: 'Feb', value: 405600 },
    { month: 'Mar', value: 402800 },
    { month: 'Apr', value: 415200 },
    { month: 'May', value: 422400 },
    { month: 'Jun', value: 428400 },
  ],
  goals: [
    { id: 1, name: 'Retirement Fund', target: 1000000, current: 428400, progress: 42.8 },
    { id: 2, name: 'Home Purchase', target: 500000, current: 185600, progress: 37.1 },
    { id: 3, name: 'Education Fund', target: 200000, current: 128200, progress: 64.1 },
  ],
  recentTransactions: [
    { id: 1, type: 'dividend', description: 'Apple Inc Dividend', amount: 450, date: '2 days ago' },
    { id: 2, type: 'transfer', description: 'Transfer to Savings', amount: -2000, date: '5 days ago' },
    { id: 3, type: 'purchase', description: 'ETF Purchase', amount: -5000, date: '1 week ago' },
  ],
  insights: [
    { icon: 'TrendingUp', title: 'Strong Performance', description: 'Your portfolio grew 2.8% this month' },
    { icon: 'Target', title: 'On Track', description: 'You are on pace to reach your retirement goal' },
    { icon: 'AlertCircle', title: 'Diversify', description: 'Consider increasing bond allocation' },
  ],
  trustScore: {
    score: 85,
    level: 'Excellent',
    factors: [
      { name: 'Account Age', score: 95 },
      { name: 'Transaction History', score: 88 },
      { name: 'Identity Verification', score: 78 },
    ],
  },
};

export const goalsData = [
  {
    id: 1,
    name: 'Retirement Fund',
    target: 1000000,
    current: 428400,
    progress: 42.8,
    deadline: '2045-12-31',
    priority: 'high',
    description: 'Build a comprehensive retirement fund for a comfortable future',
  },
  {
    id: 2,
    name: 'Home Purchase',
    target: 500000,
    current: 185600,
    progress: 37.1,
    deadline: '2027-06-30',
    priority: 'high',
    description: 'Save for down payment on a new home',
  },
  {
    id: 3,
    name: 'Education Fund',
    target: 200000,
    current: 128200,
    progress: 64.1,
    deadline: '2030-09-01',
    priority: 'medium',
    description: 'College education fund for children',
  },
  {
    id: 4,
    name: 'Vacation Fund',
    target: 15000,
    current: 8500,
    progress: 56.7,
    deadline: '2024-12-31',
    priority: 'low',
    description: 'Dream vacation fund',
  },
];

export const insightsData = [
  {
    id: 1,
    type: 'ai',
    title: 'Portfolio Optimization',
    description: 'Based on your risk profile and goals, consider reallocating 15% to emerging markets',
    impact: 'high',
    actionable: true,
  },
  {
    id: 2,
    type: 'warning',
    title: 'Expense Alert',
    description: 'Your discretionary spending increased 23% compared to last month',
    impact: 'medium',
    actionable: true,
  },
  {
    id: 3,
    type: 'opportunity',
    title: 'Tax Optimization',
    description: 'You may benefit from tax-loss harvesting in your portfolio',
    impact: 'high',
    actionable: true,
  },
  {
    id: 4,
    type: 'info',
    title: 'Market Update',
    description: 'Technology sector outperformed by 8% this quarter',
    impact: 'low',
    actionable: false,
  },
];

export const protectionData = [
  {
    id: 1,
    name: 'Life Insurance',
    status: 'active',
    coverage: 500000,
    premium: 45,
    renewalDate: '2025-03-15',
  },
  {
    id: 2,
    name: 'Disability Insurance',
    status: 'active',
    coverage: 100000,
    premium: 25,
    renewalDate: '2025-06-20',
  },
  {
    id: 3,
    name: 'Umbrella Policy',
    status: 'pending',
    coverage: 1000000,
    premium: 35,
    renewalDate: '2025-09-10',
  },
];

export const timelineData = [
  {
    date: '2024-03-15',
    title: 'Account Created',
    description: 'Your Legend financial account was successfully created',
    icon: 'UserPlus',
  },
  {
    date: '2024-03-20',
    title: 'First Deposit',
    description: 'Initial deposit of $50,000 received',
    icon: 'TrendingUp',
  },
  {
    date: '2024-04-01',
    title: 'First Investment',
    description: 'Invested $30,000 in diversified portfolio',
    icon: 'BarChart3',
  },
  {
    date: '2024-05-15',
    title: 'Goal Created',
    description: 'Set retirement goal of $1,000,000',
    icon: 'Target',
  },
  {
    date: '2024-06-20',
    title: 'Milestone Reached',
    description: 'Portfolio crossed $400,000 mark',
    icon: 'CheckCircle',
  },
];

export const trustedContactsData = [
  {
    id: 1,
    name: 'Sarah Johnson',
    relationship: 'Spouse',
    email: 'sarah.johnson@email.com',
    phone: '+1 (555) 123-4567',
    permissions: ['view', 'emergency'],
  },
  {
    id: 2,
    name: 'Michael Smith',
    relationship: 'Financial Advisor',
    email: 'michael@advisors.com',
    phone: '+1 (555) 987-6543',
    permissions: ['view'],
  },
  {
    id: 3,
    name: 'Emily Davis',
    relationship: 'Emergency Contact',
    email: 'emily.davis@email.com',
    phone: '+1 (555) 456-7890',
    permissions: ['emergency'],
  },
];
