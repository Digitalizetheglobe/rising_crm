export interface PerformanceMetrics {
  leadsAssigned: number;
  leadsContacted: number;
  followupsCompleted: number;
  siteVisitsScheduled: number;
  siteVisitsCompleted: number;
  dealsClosed: number;
  revenueGenerated: number;
  customerSatisfaction: number;
  taskCompletionRate: number;
}

export interface ProjectPerformance {
  projectId: string;
  projectName: string;
  leadsGenerated: number;
  inquiriesHandled: number;
  siteVisits: number;
  bookingsCompleted: number;
  conversionRate: number;
  revenueGenerated: number;
  propertyValueSold: number;
}

export interface ClientDetail {
  clientId: string;
  clientName: string;
  leadId: string;
  contactNumber: string;
  email: string;
  projectInterested: string;
  leadSource: string;
  currentStatus: string;
  lastActivityDate: string;
  conversionStatus: string;
  followupHistory: { date: string; notes: string }[];
}

export interface MonthlyComparison {
  currentMonth: number;
  previousMonth: number;
  last3Months: number;
  last6Months: number;
  lastYear: number;
}

export interface ActivityLog {
  callsMade: number;
  whatsappConversations: number;
  emailsSent: number;
  followupsCompleted: number;
  meetingsConducted: number;
  siteVisitsArranged: number;
  tasksCompleted: number;
}

export interface Target {
  month: string;
  targetLeads: number;
  targetRevenue: number;
  achievedLeads: number;
  achievedRevenue: number;
}

export interface EmployeeAnalytics {
  employeeId: string;
  employeeName: string;
  role: string;
  email: string;
  phone: string;
  performanceScore: number;
  performanceRank: number;
  performanceRankTotal: number;
  metrics: PerformanceMetrics;
  projects: ProjectPerformance[];
  clients: ClientDetail[];
  monthlyComparison: MonthlyComparison;
  activityLog: ActivityLog;
  targets: Target[];
  leaderboard: { rank: number; name: string; score: number; avatar: string }[];
  insights: string[];
  recommendations: string[];
  chartData: {
    monthlyRevenue: { month: string; revenue: number }[];
    conversionFunnel: { stage: string; count: number }[];
    leadSource: { source: string; count: number }[];
    projectWiseSales: { project: string; sales: number }[];
  };
}

function generateMockMetrics(): PerformanceMetrics {
  return {
    leadsAssigned: Math.floor(Math.random() * 100) + 50,
    leadsContacted: Math.floor(Math.random() * 80) + 30,
    followupsCompleted: Math.floor(Math.random() * 60) + 20,
    siteVisitsScheduled: Math.floor(Math.random() * 40) + 15,
    siteVisitsCompleted: Math.floor(Math.random() * 35) + 10,
    dealsClosed: Math.floor(Math.random() * 15) + 5,
    revenueGenerated: Math.floor(Math.random() * 50000000) + 10000000,
    customerSatisfaction: Math.floor(Math.random() * 30) + 70,
    taskCompletionRate: Math.floor(Math.random() * 20) + 80,
  };
}

function generateMockProjects(): ProjectPerformance[] {
  const projects = [
    "Sunrise Towers",
    "Green Valley Heights",
    "Downtown Plaza",
    "Waterfront Residency",
    "Sky Gardens",
  ];
  return projects.map((name, idx) => ({
    projectId: `project-${idx + 1}`,
    projectName: name,
    leadsGenerated: Math.floor(Math.random() * 50) + 10,
    inquiriesHandled: Math.floor(Math.random() * 40) + 8,
    siteVisits: Math.floor(Math.random() * 30) + 5,
    bookingsCompleted: Math.floor(Math.random() * 10) + 2,
    conversionRate: Math.floor(Math.random() * 30) + 15,
    revenueGenerated: Math.floor(Math.random() * 20000000) + 2000000,
    propertyValueSold: Math.floor(Math.random() * 50000000) + 5000000,
  }));
}

function generateMockClients(): ClientDetail[] {
  const statuses = [
    "Hot Lead",
    "Warm Lead",
    "Cold Lead",
    "Follow-up Pending",
    "Site Visit Scheduled",
    "Negotiating",
    "Booked",
  ];
  const sources = [
    "Website",
    "Referral",
    "Walk-in",
    "Phone",
    "Social Media",
  ];
  const projects = [
    "Sunrise Towers",
    "Green Valley Heights",
    "Downtown Plaza",
  ];

  return Array.from({ length: 15 }, (_, idx) => ({
    clientId: `client-${idx + 1}`,
    clientName: `Client ${idx + 1}`,
    leadId: `LEAD-2024${String(idx + 1).padStart(4, "0")}`,
    contactNumber: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    email: `client${idx + 1}@email.com`,
    projectInterested: projects[Math.floor(Math.random() * projects.length)],
    leadSource: sources[Math.floor(Math.random() * sources.length)],
    currentStatus: statuses[Math.floor(Math.random() * statuses.length)],
    lastActivityDate: new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
    ).toLocaleDateString("en-IN"),
    conversionStatus: Math.random() > 0.7 ? "Converted" : "Pending",
    followupHistory: [
      {
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(
          "en-IN"
        ),
        notes: "Initial inquiry call",
      },
      {
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString(
          "en-IN"
        ),
        notes: "Sent project details",
      },
      {
        date: new Date().toLocaleDateString("en-IN"),
        notes: "Awaiting feedback",
      },
    ],
  }));
}

function generateMockActivityLog(): ActivityLog {
  return {
    callsMade: Math.floor(Math.random() * 50) + 20,
    whatsappConversations: Math.floor(Math.random() * 40) + 15,
    emailsSent: Math.floor(Math.random() * 30) + 10,
    followupsCompleted: Math.floor(Math.random() * 25) + 8,
    meetingsConducted: Math.floor(Math.random() * 10) + 3,
    siteVisitsArranged: Math.floor(Math.random() * 15) + 5,
    tasksCompleted: Math.floor(Math.random() * 40) + 20,
  };
}

function generateMockTargets(): Target[] {
  const months = ["January", "February", "March", "April", "May", "June"];
  return months.map((month) => ({
    month,
    targetLeads: 50,
    targetRevenue: 10000000,
    achievedLeads: Math.floor(Math.random() * 60) + 20,
    achievedRevenue: Math.floor(Math.random() * 12000000) + 2000000,
  }));
}

function generateMockLeaderboard(): {
  rank: number;
  name: string;
  score: number;
  avatar: string;
}[] {
  const names = [
    "Rajesh Kumar",
    "Priya Singh",
    "Amit Sharma",
    "Neha Patel",
    "Rohit Gupta",
  ];
  const avatars = [
    "bg-red-500",
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-yellow-500",
  ];

  return names.map((name, idx) => ({
    rank: idx + 1,
    name,
    score: Math.floor(Math.random() * 50) + 80 - idx * 5,
    avatar: avatars[idx],
  }));
}

function calculatePerformanceScore(metrics: PerformanceMetrics): number {
  const weights = {
    leadsAssigned: 0.1,
    leadsContacted: 0.15,
    followupsCompleted: 0.1,
    siteVisitsScheduled: 0.1,
    siteVisitsCompleted: 0.15,
    dealsClosed: 0.2,
    revenueGenerated: 0.1,
    customerSatisfaction: 0.05,
    taskCompletionRate: 0.05,
  };

  const maxValues = {
    leadsAssigned: 100,
    leadsContacted: 80,
    followupsCompleted: 60,
    siteVisitsScheduled: 40,
    siteVisitsCompleted: 35,
    dealsClosed: 15,
    revenueGenerated: 50000000,
    customerSatisfaction: 100,
    taskCompletionRate: 100,
  };

  let score = 0;
  Object.entries(metrics).forEach(([key, value]) => {
    const normalizedValue =
      Math.min(value, maxValues[key as keyof typeof maxValues]) /
      maxValues[key as keyof typeof maxValues];
    score +=
      normalizedValue * 100 * weights[key as keyof typeof weights];
  });

  return Math.round(score);
}

export function generateMockEmployeeAnalytics(
  employeeId: string,
  employeeName: string
): EmployeeAnalytics {
  const metrics = generateMockMetrics();
  const performanceScore = calculatePerformanceScore(metrics);

  return {
    employeeId,
    employeeName,
    role: "Sales Executive",
    email: `${employeeName.toLowerCase().replace(" ", ".")}@realestatecrm.com`,
    phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    performanceScore,
    performanceRank: Math.floor(Math.random() * 5) + 1,
    performanceRankTotal: 25,
    metrics,
    projects: generateMockProjects(),
    clients: generateMockClients(),
    monthlyComparison: {
      currentMonth: performanceScore,
      previousMonth: performanceScore - Math.floor(Math.random() * 10),
      last3Months: performanceScore - Math.floor(Math.random() * 15),
      last6Months: performanceScore - Math.floor(Math.random() * 20),
      lastYear: performanceScore - Math.floor(Math.random() * 25),
    },
    activityLog: generateMockActivityLog(),
    targets: generateMockTargets(),
    leaderboard: generateMockLeaderboard(),
    insights: [
      "Your conversion rate is 15% higher than team average",
      "Green Valley Heights is your best performing project with 35% conversion",
      "Site visit completion rate: 85% - Excellent!",
      "Revenue trend shows 12% growth compared to last month",
      "Customer satisfaction score: 92/100",
    ],
    recommendations: [
      "Focus on 5 hot leads that have been inactive for more than 7 days",
      "Schedule follow-up calls for 8 pending negotiations",
      "Consider pairing with team for high-value deals above ₹5Cr",
      "Increase site visits for Downtown Plaza project - currently 20% below target",
      "Document successful deal closing strategy for team training",
    ],
    chartData: {
      monthlyRevenue: [
        { month: "January", revenue: 8500000 },
        { month: "February", revenue: 9200000 },
        { month: "March", revenue: 11500000 },
        { month: "April", revenue: 10800000 },
        { month: "May", revenue: 12300000 },
        { month: "June", revenue: 14200000 },
      ],
      conversionFunnel: [
        { stage: "Leads Assigned", count: metrics.leadsAssigned },
        { stage: "Leads Contacted", count: metrics.leadsContacted },
        { stage: "Follow-ups", count: metrics.followupsCompleted },
        { stage: "Site Visits", count: metrics.siteVisitsCompleted },
        { stage: "Bookings", count: Math.floor(metrics.dealsClosed * 1.5) },
        { stage: "Closed Deals", count: metrics.dealsClosed },
      ],
      leadSource: [
        { source: "Website", count: Math.floor(metrics.leadsAssigned * 0.3) },
        {
          source: "Referral",
          count: Math.floor(metrics.leadsAssigned * 0.25),
        },
        { source: "Walk-in", count: Math.floor(metrics.leadsAssigned * 0.2) },
        { source: "Phone", count: Math.floor(metrics.leadsAssigned * 0.15) },
        {
          source: "Social Media",
          count: Math.floor(metrics.leadsAssigned * 0.1),
        },
      ],
      projectWiseSales: [
        {
          project: "Sunrise Towers",
          sales: Math.floor(Math.random() * 8000000) + 2000000,
        },
        {
          project: "Green Valley Heights",
          sales: Math.floor(Math.random() * 9000000) + 3000000,
        },
        {
          project: "Downtown Plaza",
          sales: Math.floor(Math.random() * 7000000) + 1500000,
        },
        {
          project: "Waterfront Residency",
          sales: Math.floor(Math.random() * 6000000) + 1000000,
        },
      ],
    },
  };
}
