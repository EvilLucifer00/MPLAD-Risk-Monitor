// src/data/mockMpData.js

export const mockMpProfile = {
  name: "Dr. A. Sharma",
  constituency: "North District, State",
  totalEntitlement: 50000000, // 5 Cr per year
  fiscalYearEnd: "2027-03-31",
};

export const mockProjects = [
  {
    id: "PRJ-2026-001",
    title: "Construction of Community Hall in Block A",
    category: "Community Infrastructure",
    description: "Building a new community hall with seating capacity of 500 for local events.",
    district: "North District",
    estimatedCost: 1500000,
    sanctionedAmount: 1500000,
    amountSpent: 1200000,
    status: "In Progress",
    startDate: "2025-08-10",
    expectedEndDate: "2026-02-15",
    lastUpdated: "2026-09-12",
    vendor: "ABC Builders Pvt Ltd",
    implementingAgency: "PWD District A",
    riskScore: 25,
    riskLevel: "Low", // Low (0-39), Moderate (40-59), High (60-79), Critical (80-100)
    riskFactors: [
      { detector: "Cost Anomaly", score: 10, explanation: "Cost is within expected benchmarks for this category." },
      { detector: "Timeline Delay", score: 20, explanation: "Slight delay in foundation stage, but recoverable." },
      { detector: "Duplicate Work", score: 5, explanation: "No duplicate records found." },
      { detector: "Vendor Risk", score: 25, explanation: "Vendor has a good track record." }
    ],
    documents: [
      { id: "doc-1", name: "Project_Proposal.pdf", type: "PDF", size: "2.4 MB", uploadDate: "2025-07-01", uploader: "MP Office" },
      { id: "doc-2", name: "Initial_Estimate.pdf", type: "PDF", size: "1.1 MB", uploadDate: "2025-07-10", uploader: "PWD" }
    ]
  },
  {
    id: "PRJ-2026-002",
    title: "Solar Street Lights Installation - Phase 3",
    category: "Renewable Energy",
    description: "Installation of 100 solar street lights across 4 villages.",
    district: "South District",
    estimatedCost: 850000,
    sanctionedAmount: 850000,
    amountSpent: 850000,
    status: "Completed",
    startDate: "2025-05-01",
    expectedEndDate: "2025-10-01",
    actualEndDate: "2025-09-28",
    lastUpdated: "2026-09-10",
    vendor: "SunLight Technologies",
    implementingAgency: "Zila Parishad",
    riskScore: 12,
    riskLevel: "Low",
    riskFactors: [
      { detector: "Cost Anomaly", score: 8, explanation: "Standard pricing for solar panels." },
      { detector: "Timeline Delay", score: 0, explanation: "Completed ahead of schedule." },
      { detector: "Duplicate Work", score: 12, explanation: "Similar to Phase 2, but verified different locations." },
      { detector: "Vendor Risk", score: 5, explanation: "Highly rated vendor." }
    ],
    documents: [
      { id: "doc-3", name: "Completion_Certificate.pdf", type: "PDF", size: "850 KB", uploadDate: "2025-09-30", uploader: "Zila Parishad" }
    ]
  },
  {
    id: "PRJ-2026-003",
    title: "Upgradation of Govt Primary School",
    category: "Education",
    description: "Construction of 4 new classrooms and separate sanitation facilities.",
    district: "East District",
    estimatedCost: 2200000,
    sanctionedAmount: 2200000,
    amountSpent: 1800000,
    status: "In Progress",
    startDate: "2025-01-15",
    expectedEndDate: "2025-11-30",
    lastUpdated: "2026-09-08",
    vendor: "X Construction",
    implementingAgency: "Education Dept",
    riskScore: 82,
    riskLevel: "Critical",
    riskFactors: [
      { detector: "Cost Anomaly", score: 88, explanation: "Billed rate for materials is 1.8x the category benchmark." },
      { detector: "Timeline Delay", score: 75, explanation: "Project is 4 months past the expected end date." },
      { detector: "Duplicate Work", score: 15, explanation: "No concern." },
      { detector: "Vendor Risk", score: 92, explanation: "Vendor 'X Construction' flagged for similar cost overruns in 3 other projects." }
    ],
    documents: [
      { id: "doc-4", name: "Sanction_Order.pdf", type: "PDF", size: "1.2 MB", uploadDate: "2024-12-10", uploader: "District Authority" },
      { id: "doc-5", name: "Site_Photos_Oct.jpg", type: "Image", size: "3.5 MB", uploadDate: "2025-10-15", uploader: "Inspector" }
    ]
  },
  {
    id: "PRJ-2026-004",
    title: "Drinking Water RO Plant",
    category: "Water Supply",
    description: "Setup of 500 LPH RO plant for safe drinking water.",
    district: "West District",
    estimatedCost: 650000,
    sanctionedAmount: 0,
    amountSpent: 0,
    status: "Pending Sanction",
    startDate: null,
    expectedEndDate: null,
    lastUpdated: "2026-09-05",
    vendor: "Pending",
    implementingAgency: "PHED",
    riskScore: 45,
    riskLevel: "Moderate",
    riskFactors: [
      { detector: "Cost Anomaly", score: 40, explanation: "Estimated cost slightly higher than average." },
      { detector: "Timeline Delay", score: 10, explanation: "Not started yet." },
      { detector: "Duplicate Work", score: 65, explanation: "Another RO plant approved 5km away. Needs location verification." },
      { detector: "Vendor Risk", score: 0, explanation: "N/A" }
    ],
    documents: [
      { id: "doc-6", name: "MP_Recommendation_Letter.pdf", type: "PDF", size: "500 KB", uploadDate: "2026-01-05", uploader: "MP Office" }
    ]
  },
  {
    id: "PRJ-2026-005",
    title: "Digital Library Computers",
    category: "Education",
    description: "Procurement of 20 desktop computers for the district library.",
    district: "North District",
    estimatedCost: 1000000,
    sanctionedAmount: 1000000,
    amountSpent: 0,
    status: "Sanctioned",
    startDate: "2026-02-01",
    expectedEndDate: "2026-03-01",
    lastUpdated: "2026-09-01",
    vendor: "TechSupplies Inc",
    implementingAgency: "District IT Dept",
    riskScore: 18,
    riskLevel: "Low",
    riskFactors: [
      { detector: "Cost Anomaly", score: 15, explanation: "Prices match GeM portal rates." },
      { detector: "Timeline Delay", score: 5, explanation: "On track." },
      { detector: "Duplicate Work", score: 8, explanation: "No concern." },
      { detector: "Vendor Risk", score: 20, explanation: "Standard vendor." }
    ],
    documents: [
      { id: "doc-7", name: "GeM_Quotation.pdf", type: "PDF", size: "1.8 MB", uploadDate: "2026-01-15", uploader: "IT Dept" }
    ]
  },
  {
    id: "PRJ-2026-006",
    title: "Bus Shelter Construction",
    category: "Public Transport",
    description: "Building 3 bus shelters along the main highway.",
    district: "East District",
    estimatedCost: 900000,
    sanctionedAmount: 900000,
    amountSpent: 450000,
    status: "In Progress",
    startDate: "2025-11-01",
    expectedEndDate: "2026-01-31",
    lastUpdated: "2026-08-25",
    vendor: "X Construction",
    implementingAgency: "PWD",
    riskScore: 68,
    riskLevel: "High",
    riskFactors: [
      { detector: "Cost Anomaly", score: 55, explanation: "Marginal cost inflation detected." },
      { detector: "Timeline Delay", score: 60, explanation: "Progress slower than planned." },
      { detector: "Duplicate Work", score: 10, explanation: "No concern." },
      { detector: "Vendor Risk", score: 92, explanation: "Vendor 'X Construction' flagged for issues in other projects." }
    ],
    documents: [
      { id: "doc-8", name: "Approved_Design.pdf", type: "PDF", size: "4.2 MB", uploadDate: "2025-10-20", uploader: "PWD" }
    ]
  },
  {
    id: "PRJ-2026-007",
    title: "Healthcare Equipment for CHC",
    category: "Health",
    description: "Providing X-Ray and ECG machines to Community Health Center.",
    district: "South District",
    estimatedCost: 3500000,
    sanctionedAmount: 0,
    amountSpent: 0,
    status: "Rejected",
    startDate: null,
    expectedEndDate: null,
    lastUpdated: "2026-08-20",
    vendor: "Pending",
    implementingAgency: "Health Dept",
    riskScore: 0,
    riskLevel: "Low",
    riskFactors: [],
    documents: []
  }
];

export const mockNotifications = [
  {
    id: "notif-1",
    type: "warning", // success, error, warning, info
    message: "Project 'Upgradation of Govt Primary School' flagged as Critical Risk by AI system.",
    timestamp: "2026-01-20T10:30:00Z",
    read: false,
    projectId: "PRJ-2026-003"
  },
  {
    id: "notif-2",
    type: "info",
    message: "District Authority requested revised estimates for 'Drinking Water RO Plant'.",
    timestamp: "2026-01-19T14:15:00Z",
    read: false,
    projectId: "PRJ-2026-004"
  },
  {
    id: "notif-3",
    type: "success",
    message: "Funds sanctioned for 'Digital Library Computers'.",
    timestamp: "2026-01-18T09:00:00Z",
    read: true,
    projectId: "PRJ-2026-005"
  },
  {
    id: "notif-4",
    type: "error",
    message: "Project 'Healthcare Equipment for CHC' rejected due to budget constraints in health sector.",
    timestamp: "2026-01-15T16:45:00Z",
    read: true,
    projectId: "PRJ-2026-007"
  }
];

export const mockRecommendations = [
  {
    id: "rec-1",
    type: "Vendor Alert",
    severity: "High",
    message: "Vendor 'X Construction' has been flagged in 2 of your active projects (Critical/High risk). Review before approving new work with them.",
    relatedProjectIds: ["PRJ-2026-003", "PRJ-2026-006"]
  },
  {
    id: "rec-2",
    type: "Utilization Warning",
    severity: "Medium",
    message: "Your unspent balance is 42% with 2 months left in the fiscal year. Consider expediting pending proposals.",
    relatedProjectIds: []
  },
  {
    id: "rec-3",
    type: "Duplicate Check",
    severity: "Medium",
    message: "Proposed 'Drinking Water RO Plant' is within 5km of an existing RO plant sanctioned in 2024. Location verification recommended.",
    relatedProjectIds: ["PRJ-2026-004"]
  }
];
