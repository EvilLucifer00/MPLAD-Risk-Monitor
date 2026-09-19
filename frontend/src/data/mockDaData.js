// src/data/mockDaData.js

export const mockDaProfile = {
  name: "Shri R.K. Verma, IAS",
  designation: "District Collector & District Authority",
  district: "Lucknow District",
  state: "Uttar Pradesh",
};

export const mockMPs = [
  {
    id: "MP-001",
    name: "Dr. A. Sharma",
    constituency: "Lucknow North",
    party: "National Party A",
    totalEntitlement: 50000000,
    termStart: "2024-06-01",
  },
  {
    id: "MP-002",
    name: "Smt. Priya Gupta",
    constituency: "Lucknow South",
    party: "National Party B",
    totalEntitlement: 50000000,
    termStart: "2024-06-01",
  },
  {
    id: "MP-003",
    name: "Shri Vikram Yadav",
    constituency: "Lucknow East",
    party: "National Party A",
    totalEntitlement: 50000000,
    termStart: "2024-06-01",
  },
  {
    id: "MP-004",
    name: "Dr. Meena Singh",
    constituency: "Lucknow West",
    party: "Regional Party C",
    totalEntitlement: 50000000,
    termStart: "2024-06-01",
  },
  {
    id: "MP-005",
    name: "Shri Rajesh Tiwari",
    constituency: "Lucknow Central",
    party: "National Party B",
    totalEntitlement: 50000000,
    termStart: "2024-06-01",
  },
];

export const mockImplementingAgencies = [
  { id: "IA-001", name: "PWD — Public Works Department", projectsHandled: 34, avgCompletionMonths: 8.2, avgRiskScore: 28, status: "Active" },
  { id: "IA-002", name: "Zila Parishad", projectsHandled: 22, avgCompletionMonths: 6.5, avgRiskScore: 18, status: "Active" },
  { id: "IA-003", name: "Education Department", projectsHandled: 15, avgCompletionMonths: 10.1, avgRiskScore: 35, status: "Active" },
  { id: "IA-004", name: "PHED — Public Health Engineering", projectsHandled: 19, avgCompletionMonths: 7.8, avgRiskScore: 22, status: "Active" },
  { id: "IA-005", name: "District IT Department", projectsHandled: 8, avgCompletionMonths: 4.2, avgRiskScore: 12, status: "Active" },
  { id: "IA-006", name: "Health Department", projectsHandled: 12, avgCompletionMonths: 9.5, avgRiskScore: 31, status: "Under Review" },
];

export const mockVendors = [
  { id: "V-001", name: "ABC Builders Pvt Ltd", projectsCount: 6, avgRiskScore: 22, flagged: false, flagNotes: "" },
  { id: "V-002", name: "SunLight Technologies", projectsCount: 4, avgRiskScore: 10, flagged: false, flagNotes: "" },
  { id: "V-003", name: "X Construction", projectsCount: 8, avgRiskScore: 78, flagged: true, flagNotes: "Flagged for cost overruns across 3+ projects. Under investigation for potential bid rigging in education sector projects." },
  { id: "V-004", name: "TechSupplies Inc", projectsCount: 3, avgRiskScore: 15, flagged: false, flagNotes: "" },
  { id: "V-005", name: "Metro Infrastructure Corp", projectsCount: 5, avgRiskScore: 45, flagged: true, flagNotes: "Multiple timeline delays. Material quality complaints from 2 IAs." },
  { id: "V-006", name: "GreenBuild Solutions", projectsCount: 2, avgRiskScore: 8, flagged: false, flagNotes: "" },
  { id: "V-007", name: "Reliable Electricals", projectsCount: 7, avgRiskScore: 55, flagged: true, flagNotes: "Suspected circular sub-contracting. Same vendor registered under 3 different names." },
  { id: "V-008", name: "Apex Medical Supplies", projectsCount: 2, avgRiskScore: 20, flagged: false, flagNotes: "" },
];

// ─── Projects: 25 projects across 5 MPs, covering all review statuses ───

export const mockDaProjects = [
  // ────── MP-001: Dr. A. Sharma (Lucknow North) — 6 projects ──────
  {
    id: "PRJ-2026-001", mpId: "MP-001", mpName: "Dr. A. Sharma", constituency: "Lucknow North",
    title: "Construction of Community Hall in Block A", category: "Community Infrastructure",
    description: "Building a new community hall with seating capacity of 500 for local events and public meetings.",
    district: "Lucknow", estimatedCost: 1500000, sanctionedAmount: 1500000, amountSpent: 1200000,
    status: "In Progress", reviewStatus: "Sanctioned",
    startDate: "2025-08-10", expectedEndDate: "2026-02-15", lastUpdated: "2026-09-12",
    vendor: "ABC Builders Pvt Ltd", vendorId: "V-001",
    implementingAgency: "PWD — Public Works Department", assignedImplementingAgency: "IA-001",
    riskScore: 25, riskLevel: "Low",
    riskFactors: [
      { detector: "Cost Anomaly", score: 10, explanation: "Cost is within expected benchmarks for this category." },
      { detector: "Timeline Delay", score: 20, explanation: "Slight delay in foundation stage, but recoverable." },
      { detector: "Duplicate Work", score: 5, explanation: "No duplicate records found." },
      { detector: "Vendor Risk", score: 25, explanation: "Vendor has a good track record." }
    ],
    documents: [
      { id: "doc-1", name: "Project_Proposal.pdf", type: "PDF", size: "2.4 MB", uploadDate: "2025-07-01", uploader: "MP Office" },
      { id: "doc-2", name: "Initial_Estimate.pdf", type: "PDF", size: "1.1 MB", uploadDate: "2025-07-10", uploader: "PWD" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Dr. A. Sharma (MP)", timestamp: "2025-07-01T10:00:00Z", reason: "New project recommendation for community infrastructure." },
      { action: "Sanctioned", actor: "Shri R.K. Verma (DA)", timestamp: "2025-08-05T14:30:00Z", reason: "Approved. IA: PWD assigned for implementation." },
    ]
  },
  {
    id: "PRJ-2026-002", mpId: "MP-001", mpName: "Dr. A. Sharma", constituency: "Lucknow North",
    title: "Solar Street Lights Installation — Phase 3", category: "Renewable Energy",
    description: "Installation of 100 solar street lights across 4 villages in the constituency.",
    district: "Lucknow", estimatedCost: 850000, sanctionedAmount: 850000, amountSpent: 850000,
    status: "Completed", reviewStatus: "Sanctioned",
    startDate: "2025-05-01", expectedEndDate: "2025-10-01", actualEndDate: "2025-09-28", lastUpdated: "2026-09-10",
    vendor: "SunLight Technologies", vendorId: "V-002",
    implementingAgency: "Zila Parishad", assignedImplementingAgency: "IA-002",
    riskScore: 12, riskLevel: "Low",
    riskFactors: [
      { detector: "Cost Anomaly", score: 8, explanation: "Standard pricing for solar panels." },
      { detector: "Timeline Delay", score: 0, explanation: "Completed ahead of schedule." },
      { detector: "Duplicate Work", score: 12, explanation: "Similar to Phase 2, but verified different locations." },
      { detector: "Vendor Risk", score: 5, explanation: "Highly rated vendor." }
    ],
    documents: [
      { id: "doc-3", name: "Completion_Certificate.pdf", type: "PDF", size: "850 KB", uploadDate: "2025-09-30", uploader: "Zila Parishad" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Dr. A. Sharma (MP)", timestamp: "2025-04-15T09:00:00Z", reason: "Phase 3 continuation of solar street lighting program." },
      { action: "Sanctioned", actor: "Shri R.K. Verma (DA)", timestamp: "2025-04-25T11:00:00Z", reason: "Approved based on Phase 2 success. IA: Zila Parishad." },
    ]
  },
  {
    id: "PRJ-2026-005", mpId: "MP-001", mpName: "Dr. A. Sharma", constituency: "Lucknow North",
    title: "Digital Library Computers", category: "Education",
    description: "Procurement of 20 desktop computers for the district library digital literacy program.",
    district: "Lucknow", estimatedCost: 1000000, sanctionedAmount: 1000000, amountSpent: 0,
    status: "Sanctioned", reviewStatus: "Sanctioned",
    startDate: "2026-02-01", expectedEndDate: "2026-03-01", lastUpdated: "2026-09-01",
    vendor: "TechSupplies Inc", vendorId: "V-004",
    implementingAgency: "District IT Department", assignedImplementingAgency: "IA-005",
    riskScore: 18, riskLevel: "Low",
    riskFactors: [
      { detector: "Cost Anomaly", score: 15, explanation: "Prices match GeM portal rates." },
      { detector: "Timeline Delay", score: 5, explanation: "On track." },
      { detector: "Duplicate Work", score: 8, explanation: "No concern." },
      { detector: "Vendor Risk", score: 20, explanation: "Standard vendor." }
    ],
    documents: [
      { id: "doc-7", name: "GeM_Quotation.pdf", type: "PDF", size: "1.8 MB", uploadDate: "2026-01-15", uploader: "IT Dept" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Dr. A. Sharma (MP)", timestamp: "2026-01-10T09:30:00Z", reason: "Digital literacy initiative for constituency." },
      { action: "Sanctioned", actor: "Shri R.K. Verma (DA)", timestamp: "2026-01-28T16:00:00Z", reason: "Approved. GeM rates verified. IA: District IT Dept." },
    ]
  },
  {
    id: "PRJ-2026-010", mpId: "MP-001", mpName: "Dr. A. Sharma", constituency: "Lucknow North",
    title: "Public Park Renovation — Sector 12", category: "Community Infrastructure",
    description: "Renovation of the existing public park with new playground equipment, walking track, and landscaping.",
    district: "Lucknow", estimatedCost: 1200000, sanctionedAmount: 0, amountSpent: 0,
    status: "Pending Sanction", reviewStatus: "Pending Review",
    startDate: null, expectedEndDate: null, lastUpdated: "2026-09-15",
    vendor: "GreenBuild Solutions", vendorId: "V-006",
    implementingAgency: "Pending", assignedImplementingAgency: null,
    riskScore: 22, riskLevel: "Low",
    riskFactors: [
      { detector: "Cost Anomaly", score: 18, explanation: "Within normal range for park renovation." },
      { detector: "Timeline Delay", score: 0, explanation: "Not yet started." },
      { detector: "Duplicate Work", score: 10, explanation: "No existing park renovation in this area." },
      { detector: "Vendor Risk", score: 8, explanation: "GreenBuild Solutions has good track record." }
    ],
    documents: [
      { id: "doc-20", name: "Park_Renovation_Proposal.pdf", type: "PDF", size: "3.1 MB", uploadDate: "2026-09-14", uploader: "MP Office" },
      { id: "doc-21", name: "Site_Survey_Report.pdf", type: "PDF", size: "2.2 MB", uploadDate: "2026-09-14", uploader: "PWD" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Dr. A. Sharma (MP)", timestamp: "2026-09-14T10:00:00Z", reason: "Community request for park renovation." },
    ]
  },
  {
    id: "PRJ-2026-011", mpId: "MP-001", mpName: "Dr. A. Sharma", constituency: "Lucknow North",
    title: "CCTV Surveillance System — Market Area", category: "Public Safety",
    description: "Installation of 50 CCTV cameras with central monitoring system at the main market area.",
    district: "Lucknow", estimatedCost: 2500000, sanctionedAmount: 0, amountSpent: 0,
    status: "Pending Sanction", reviewStatus: "Pending Review",
    startDate: null, expectedEndDate: null, lastUpdated: "2026-09-18",
    vendor: "Pending", vendorId: null,
    implementingAgency: "Pending", assignedImplementingAgency: null,
    riskScore: 38, riskLevel: "Low",
    riskFactors: [
      { detector: "Cost Anomaly", score: 35, explanation: "Slightly above average but within acceptable range for surveillance systems." },
      { detector: "Timeline Delay", score: 0, explanation: "Not yet started." },
      { detector: "Duplicate Work", score: 30, explanation: "Similar surveillance project exists 3km away in adjacent ward." },
      { detector: "Vendor Risk", score: 0, explanation: "Vendor not yet assigned." }
    ],
    documents: [
      { id: "doc-22", name: "CCTV_Proposal.pdf", type: "PDF", size: "1.9 MB", uploadDate: "2026-09-17", uploader: "MP Office" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Dr. A. Sharma (MP)", timestamp: "2026-09-17T11:00:00Z", reason: "Public safety improvement for market area." },
    ]
  },

  // ────── MP-002: Smt. Priya Gupta (Lucknow South) — 5 projects ──────
  {
    id: "PRJ-2026-003", mpId: "MP-002", mpName: "Smt. Priya Gupta", constituency: "Lucknow South",
    title: "Upgradation of Govt Primary School", category: "Education",
    description: "Construction of 4 new classrooms, separate sanitation facilities, and boundary wall.",
    district: "Lucknow", estimatedCost: 2200000, sanctionedAmount: 2200000, amountSpent: 1800000,
    status: "In Progress", reviewStatus: "Sanctioned",
    startDate: "2025-01-15", expectedEndDate: "2025-11-30", lastUpdated: "2026-09-08",
    vendor: "X Construction", vendorId: "V-003",
    implementingAgency: "Education Department", assignedImplementingAgency: "IA-003",
    riskScore: 82, riskLevel: "Critical",
    riskFactors: [
      { detector: "Cost Anomaly", score: 88, explanation: "Billed rate for materials is 1.8x the category benchmark." },
      { detector: "Timeline Delay", score: 75, explanation: "Project is 4 months past the expected end date." },
      { detector: "Duplicate Work", score: 15, explanation: "No concern." },
      { detector: "Vendor Risk", score: 92, explanation: "Vendor 'X Construction' flagged for similar cost overruns in 3 other projects." }
    ],
    documents: [
      { id: "doc-4", name: "Sanction_Order.pdf", type: "PDF", size: "1.2 MB", uploadDate: "2024-12-10", uploader: "District Authority" },
      { id: "doc-5", name: "Site_Photos_Oct.jpg", type: "Image", size: "3.5 MB", uploadDate: "2025-10-15", uploader: "Inspector" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Smt. Priya Gupta (MP)", timestamp: "2024-12-01T09:00:00Z", reason: "Critical need for additional classrooms." },
      { action: "Sanctioned", actor: "Shri R.K. Verma (DA)", timestamp: "2024-12-10T14:00:00Z", reason: "Approved. IA: Education Dept." },
      { action: "Risk Alert — Critical", actor: "AI System", timestamp: "2026-09-08T10:30:00Z", reason: "Auto-flagged: cost anomaly 1.8x benchmark, vendor flagged across multiple projects." },
    ]
  },
  {
    id: "PRJ-2026-004", mpId: "MP-002", mpName: "Smt. Priya Gupta", constituency: "Lucknow South",
    title: "Drinking Water RO Plant", category: "Water Supply",
    description: "Setup of 500 LPH RO plant for safe drinking water in underserved area.",
    district: "Lucknow", estimatedCost: 650000, sanctionedAmount: 0, amountSpent: 0,
    status: "Pending Sanction", reviewStatus: "Awaiting Verification",
    startDate: null, expectedEndDate: null, lastUpdated: "2026-09-05",
    vendor: "Pending", vendorId: null,
    implementingAgency: "PHED — Public Health Engineering", assignedImplementingAgency: null,
    riskScore: 45, riskLevel: "Moderate",
    riskFactors: [
      { detector: "Cost Anomaly", score: 40, explanation: "Estimated cost slightly higher than average." },
      { detector: "Timeline Delay", score: 10, explanation: "Not started yet." },
      { detector: "Duplicate Work", score: 65, explanation: "Another RO plant approved 5km away. Needs location verification." },
      { detector: "Vendor Risk", score: 0, explanation: "N/A" }
    ],
    documents: [
      { id: "doc-6", name: "MP_Recommendation_Letter.pdf", type: "PDF", size: "500 KB", uploadDate: "2026-01-05", uploader: "MP Office" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Smt. Priya Gupta (MP)", timestamp: "2026-01-05T10:00:00Z", reason: "Safe drinking water for Block C villages." },
      { action: "Request Additional Documents", actor: "Shri R.K. Verma (DA)", timestamp: "2026-01-20T15:00:00Z", reason: "Need water quality test report and distance verification from existing RO plant at Block B." },
    ]
  },
  {
    id: "PRJ-2026-007", mpId: "MP-002", mpName: "Smt. Priya Gupta", constituency: "Lucknow South",
    title: "Healthcare Equipment for CHC", category: "Health",
    description: "Providing X-Ray and ECG machines to Community Health Center.",
    district: "Lucknow", estimatedCost: 3500000, sanctionedAmount: 0, amountSpent: 0,
    status: "Rejected", reviewStatus: "Rejected",
    startDate: null, expectedEndDate: null, lastUpdated: "2026-08-20",
    vendor: "Apex Medical Supplies", vendorId: "V-008",
    implementingAgency: "Health Department", assignedImplementingAgency: null,
    riskScore: 0, riskLevel: "Low",
    riskFactors: [],
    documents: [],
    actionHistory: [
      { action: "Project Submitted", actor: "Smt. Priya Gupta (MP)", timestamp: "2026-07-15T09:00:00Z", reason: "Upgrade medical facilities at CHC." },
      { action: "Rejected", actor: "Shri R.K. Verma (DA)", timestamp: "2026-08-20T11:30:00Z", reason: "Cost exceeds justified estimate. Similar equipment was procured at 40% lower cost in adjacent district. Recommend re-submission with revised quotation from GeM portal." },
    ]
  },
  {
    id: "PRJ-2026-012", mpId: "MP-002", mpName: "Smt. Priya Gupta", constituency: "Lucknow South",
    title: "Women's Skill Development Center", category: "Social Welfare",
    description: "Establishing a skill development center for women with sewing, computer, and beauty training programs.",
    district: "Lucknow", estimatedCost: 1800000, sanctionedAmount: 0, amountSpent: 0,
    status: "Pending Sanction", reviewStatus: "Pending Review",
    startDate: null, expectedEndDate: null, lastUpdated: "2026-09-16",
    vendor: "Pending", vendorId: null,
    implementingAgency: "Pending", assignedImplementingAgency: null,
    riskScore: 15, riskLevel: "Low",
    riskFactors: [
      { detector: "Cost Anomaly", score: 12, explanation: "Cost is within expected benchmarks." },
      { detector: "Timeline Delay", score: 0, explanation: "Not yet started." },
      { detector: "Duplicate Work", score: 5, explanation: "No similar project in this area." },
      { detector: "Vendor Risk", score: 0, explanation: "N/A" }
    ],
    documents: [
      { id: "doc-23", name: "Skill_Center_Proposal.pdf", type: "PDF", size: "2.8 MB", uploadDate: "2026-09-15", uploader: "MP Office" },
      { id: "doc-24", name: "Building_Plan.pdf", type: "PDF", size: "4.1 MB", uploadDate: "2026-09-15", uploader: "PWD" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Smt. Priya Gupta (MP)", timestamp: "2026-09-15T14:00:00Z", reason: "Women empowerment initiative." },
    ]
  },
  {
    id: "PRJ-2026-013", mpId: "MP-002", mpName: "Smt. Priya Gupta", constituency: "Lucknow South",
    title: "Ambulance Service for Rural Areas", category: "Health",
    description: "Procurement of 2 ambulances with basic life support equipment for rural healthcare access.",
    district: "Lucknow", estimatedCost: 4200000, sanctionedAmount: 0, amountSpent: 0,
    status: "Pending Sanction", reviewStatus: "Pending Review",
    startDate: null, expectedEndDate: null, lastUpdated: "2026-09-19",
    vendor: "Apex Medical Supplies", vendorId: "V-008",
    implementingAgency: "Pending", assignedImplementingAgency: null,
    riskScore: 62, riskLevel: "High",
    riskFactors: [
      { detector: "Cost Anomaly", score: 72, explanation: "Estimated cost is 1.4x the average for ambulance procurement. Market rate for BLS ambulances is ₹18-20L each." },
      { detector: "Timeline Delay", score: 0, explanation: "Not yet started." },
      { detector: "Duplicate Work", score: 20, explanation: "No duplication concern." },
      { detector: "Vendor Risk", score: 55, explanation: "Vendor previously had a rejected project — needs additional scrutiny." }
    ],
    documents: [
      { id: "doc-25", name: "Ambulance_Proposal.pdf", type: "PDF", size: "1.5 MB", uploadDate: "2026-09-18", uploader: "MP Office" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Smt. Priya Gupta (MP)", timestamp: "2026-09-18T16:00:00Z", reason: "Rural healthcare access improvement." },
    ]
  },

  // ────── MP-003: Shri Vikram Yadav (Lucknow East) — 5 projects ──────
  {
    id: "PRJ-2026-006", mpId: "MP-003", mpName: "Shri Vikram Yadav", constituency: "Lucknow East",
    title: "Bus Shelter Construction", category: "Public Transport",
    description: "Building 3 bus shelters along the main highway at key stops.",
    district: "Lucknow", estimatedCost: 900000, sanctionedAmount: 900000, amountSpent: 450000,
    status: "In Progress", reviewStatus: "Sanctioned",
    startDate: "2025-11-01", expectedEndDate: "2026-01-31", lastUpdated: "2026-08-25",
    vendor: "X Construction", vendorId: "V-003",
    implementingAgency: "PWD — Public Works Department", assignedImplementingAgency: "IA-001",
    riskScore: 68, riskLevel: "High",
    riskFactors: [
      { detector: "Cost Anomaly", score: 55, explanation: "Marginal cost inflation detected." },
      { detector: "Timeline Delay", score: 60, explanation: "Progress slower than planned." },
      { detector: "Duplicate Work", score: 10, explanation: "No concern." },
      { detector: "Vendor Risk", score: 92, explanation: "Vendor 'X Construction' flagged for issues in other projects." }
    ],
    documents: [
      { id: "doc-8", name: "Approved_Design.pdf", type: "PDF", size: "4.2 MB", uploadDate: "2025-10-20", uploader: "PWD" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Shri Vikram Yadav (MP)", timestamp: "2025-10-10T09:00:00Z", reason: "Public transport infrastructure improvement." },
      { action: "Sanctioned", actor: "Shri R.K. Verma (DA)", timestamp: "2025-10-28T15:30:00Z", reason: "Approved. IA: PWD." },
      { action: "Risk Alert — High", actor: "AI System", timestamp: "2026-08-25T08:00:00Z", reason: "Timeline delay detected. Vendor flagged in other projects." },
    ]
  },
  {
    id: "PRJ-2026-014", mpId: "MP-003", mpName: "Shri Vikram Yadav", constituency: "Lucknow East",
    title: "Drainage System Improvement — Ward 7", category: "Water Supply",
    description: "Construction of 2km storm water drainage to prevent waterlogging in residential areas.",
    district: "Lucknow", estimatedCost: 3200000, sanctionedAmount: 3200000, amountSpent: 2400000,
    status: "In Progress", reviewStatus: "Sanctioned",
    startDate: "2025-06-01", expectedEndDate: "2025-12-31", lastUpdated: "2026-09-10",
    vendor: "Metro Infrastructure Corp", vendorId: "V-005",
    implementingAgency: "PWD — Public Works Department", assignedImplementingAgency: "IA-001",
    riskScore: 55, riskLevel: "Moderate",
    riskFactors: [
      { detector: "Cost Anomaly", score: 45, explanation: "Material costs are 15% above benchmark." },
      { detector: "Timeline Delay", score: 70, explanation: "Project 9 months past expected end date." },
      { detector: "Duplicate Work", score: 5, explanation: "No concern." },
      { detector: "Vendor Risk", score: 45, explanation: "Metro Infrastructure has had timeline issues before." }
    ],
    documents: [
      { id: "doc-26", name: "Drainage_Design.pdf", type: "PDF", size: "5.6 MB", uploadDate: "2025-05-20", uploader: "PWD" },
      { id: "doc-27", name: "Progress_Report_Aug.pdf", type: "PDF", size: "1.8 MB", uploadDate: "2026-08-30", uploader: "PWD" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Shri Vikram Yadav (MP)", timestamp: "2025-05-10T10:00:00Z", reason: "Waterlogging prevention in Ward 7." },
      { action: "Sanctioned", actor: "Shri R.K. Verma (DA)", timestamp: "2025-05-28T14:00:00Z", reason: "Approved. IA: PWD." },
    ]
  },
  {
    id: "PRJ-2026-015", mpId: "MP-003", mpName: "Shri Vikram Yadav", constituency: "Lucknow East",
    title: "Sports Ground Development", category: "Community Infrastructure",
    description: "Development of a multi-sport facility with cricket pitch, badminton courts, and running track.",
    district: "Lucknow", estimatedCost: 4500000, sanctionedAmount: 0, amountSpent: 0,
    status: "Pending Sanction", reviewStatus: "Pending Review",
    startDate: null, expectedEndDate: null, lastUpdated: "2026-09-17",
    vendor: "Metro Infrastructure Corp", vendorId: "V-005",
    implementingAgency: "Pending", assignedImplementingAgency: null,
    riskScore: 72, riskLevel: "High",
    riskFactors: [
      { detector: "Cost Anomaly", score: 65, explanation: "Cost is 1.3x the average for similar sports facilities." },
      { detector: "Timeline Delay", score: 0, explanation: "Not yet started." },
      { detector: "Duplicate Work", score: 25, explanation: "Existing sports ground 2km away — needs justification for new facility." },
      { detector: "Vendor Risk", score: 72, explanation: "Metro Infrastructure Corp has been flagged for timeline delays and material quality issues." }
    ],
    documents: [
      { id: "doc-28", name: "Sports_Ground_Proposal.pdf", type: "PDF", size: "3.4 MB", uploadDate: "2026-09-16", uploader: "MP Office" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Shri Vikram Yadav (MP)", timestamp: "2026-09-16T12:00:00Z", reason: "Youth sports infrastructure development." },
    ]
  },
  {
    id: "PRJ-2026-016", mpId: "MP-003", mpName: "Shri Vikram Yadav", constituency: "Lucknow East",
    title: "Street Light Replacement — LED Retrofit", category: "Renewable Energy",
    description: "Replacing 200 conventional street lights with energy-efficient LED fixtures across 3 wards.",
    district: "Lucknow", estimatedCost: 600000, sanctionedAmount: 0, amountSpent: 0,
    status: "Pending Sanction", reviewStatus: "Pending Review",
    startDate: null, expectedEndDate: null, lastUpdated: "2026-09-19",
    vendor: "Reliable Electricals", vendorId: "V-007",
    implementingAgency: "Pending", assignedImplementingAgency: null,
    riskScore: 58, riskLevel: "Moderate",
    riskFactors: [
      { detector: "Cost Anomaly", score: 30, explanation: "Within acceptable range." },
      { detector: "Timeline Delay", score: 0, explanation: "Not yet started." },
      { detector: "Duplicate Work", score: 15, explanation: "No concern." },
      { detector: "Vendor Risk", score: 85, explanation: "Reliable Electricals suspected of circular sub-contracting. Registered under 3 different company names." }
    ],
    documents: [
      { id: "doc-29", name: "LED_Retrofit_Proposal.pdf", type: "PDF", size: "1.2 MB", uploadDate: "2026-09-18", uploader: "MP Office" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Shri Vikram Yadav (MP)", timestamp: "2026-09-18T09:00:00Z", reason: "Energy saving and better illumination." },
    ]
  },
  {
    id: "PRJ-2026-017", mpId: "MP-003", mpName: "Shri Vikram Yadav", constituency: "Lucknow East",
    title: "Anganwadi Center Renovation", category: "Social Welfare",
    description: "Renovation of 5 Anganwadi centers including new kitchen, play area, and sanitation.",
    district: "Lucknow", estimatedCost: 1100000, sanctionedAmount: 1100000, amountSpent: 800000,
    status: "In Progress", reviewStatus: "Escalated",
    startDate: "2025-09-01", expectedEndDate: "2026-03-31", lastUpdated: "2026-09-05",
    vendor: "X Construction", vendorId: "V-003",
    implementingAgency: "Zila Parishad", assignedImplementingAgency: "IA-002",
    riskScore: 85, riskLevel: "Critical",
    riskFactors: [
      { detector: "Cost Anomaly", score: 90, explanation: "Kitchen construction billed at 2.1x the standard rate." },
      { detector: "Timeline Delay", score: 65, explanation: "5 months past expected completion." },
      { detector: "Duplicate Work", score: 10, explanation: "No concern." },
      { detector: "Vendor Risk", score: 92, explanation: "X Construction has critical flags across district." }
    ],
    documents: [
      { id: "doc-30", name: "Anganwadi_Renovation_Plan.pdf", type: "PDF", size: "2.1 MB", uploadDate: "2025-08-20", uploader: "Zila Parishad" },
      { id: "doc-31", name: "Cost_Comparison_Report.pdf", type: "PDF", size: "900 KB", uploadDate: "2026-09-01", uploader: "District Authority" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Shri Vikram Yadav (MP)", timestamp: "2025-08-15T10:00:00Z", reason: "Upgrade child care facilities." },
      { action: "Sanctioned", actor: "Shri R.K. Verma (DA)", timestamp: "2025-08-28T14:30:00Z", reason: "Approved. IA: Zila Parishad." },
      { action: "Risk Alert — Critical", actor: "AI System", timestamp: "2026-08-20T09:00:00Z", reason: "Cost anomaly 2.1x for kitchen construction. Vendor X Construction flagged." },
      { action: "Escalated", actor: "Shri R.K. Verma (DA)", timestamp: "2026-09-05T16:00:00Z", reason: "Escalated to State Nodal Authority for investigation. Cost anomaly and vendor pattern across district is concerning." },
    ]
  },

  // ────── MP-004: Dr. Meena Singh (Lucknow West) — 5 projects ──────
  {
    id: "PRJ-2026-018", mpId: "MP-004", mpName: "Dr. Meena Singh", constituency: "Lucknow West",
    title: "Primary Health Center Upgrade", category: "Health",
    description: "Upgrading the PHC with new OPD block, pharmacy, and pathology lab equipment.",
    district: "Lucknow", estimatedCost: 5000000, sanctionedAmount: 5000000, amountSpent: 3200000,
    status: "In Progress", reviewStatus: "Sanctioned",
    startDate: "2025-03-01", expectedEndDate: "2026-01-31", lastUpdated: "2026-09-12",
    vendor: "ABC Builders Pvt Ltd", vendorId: "V-001",
    implementingAgency: "Health Department", assignedImplementingAgency: "IA-006",
    riskScore: 32, riskLevel: "Low",
    riskFactors: [
      { detector: "Cost Anomaly", score: 20, explanation: "Within normal range for healthcare infrastructure." },
      { detector: "Timeline Delay", score: 40, explanation: "Minor delay but within acceptable limits." },
      { detector: "Duplicate Work", score: 5, explanation: "No concern." },
      { detector: "Vendor Risk", score: 22, explanation: "ABC Builders has good track record." }
    ],
    documents: [
      { id: "doc-32", name: "PHC_Upgrade_Plan.pdf", type: "PDF", size: "4.5 MB", uploadDate: "2025-02-15", uploader: "Health Dept" },
      { id: "doc-33", name: "Equipment_List.pdf", type: "PDF", size: "1.3 MB", uploadDate: "2025-02-20", uploader: "Health Dept" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Dr. Meena Singh (MP)", timestamp: "2025-02-10T09:00:00Z", reason: "Healthcare access improvement." },
      { action: "Sanctioned", actor: "Shri R.K. Verma (DA)", timestamp: "2025-02-25T16:00:00Z", reason: "Approved. IA: Health Department." },
    ]
  },
  {
    id: "PRJ-2026-019", mpId: "MP-004", mpName: "Dr. Meena Singh", constituency: "Lucknow West",
    title: "Village Road Blacktopping — Phase 2", category: "Roads",
    description: "Blacktopping of 5km village roads connecting 3 hamlets to the state highway.",
    district: "Lucknow", estimatedCost: 3800000, sanctionedAmount: 3800000, amountSpent: 1900000,
    status: "In Progress", reviewStatus: "Suspended",
    startDate: "2025-07-01", expectedEndDate: "2026-01-31", lastUpdated: "2026-09-10",
    vendor: "Metro Infrastructure Corp", vendorId: "V-005",
    implementingAgency: "PWD — Public Works Department", assignedImplementingAgency: "IA-001",
    riskScore: 76, riskLevel: "High",
    riskFactors: [
      { detector: "Cost Anomaly", score: 70, explanation: "Bitumen quantity billed is 30% higher than engineering estimate." },
      { detector: "Timeline Delay", score: 55, explanation: "3 months behind schedule." },
      { detector: "Duplicate Work", score: 10, explanation: "No concern." },
      { detector: "Vendor Risk", score: 72, explanation: "Metro Infrastructure Corp has material quality complaints." }
    ],
    documents: [
      { id: "doc-34", name: "Road_Survey.pdf", type: "PDF", size: "3.2 MB", uploadDate: "2025-06-15", uploader: "PWD" },
      { id: "doc-35", name: "Inspection_Report_Aug.pdf", type: "PDF", size: "2.1 MB", uploadDate: "2026-08-15", uploader: "District Authority" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Dr. Meena Singh (MP)", timestamp: "2025-06-10T09:00:00Z", reason: "Rural road connectivity." },
      { action: "Sanctioned", actor: "Shri R.K. Verma (DA)", timestamp: "2025-06-25T14:00:00Z", reason: "Approved. IA: PWD." },
      { action: "Risk Alert — High", actor: "AI System", timestamp: "2026-08-10T10:00:00Z", reason: "Bitumen billing anomaly detected." },
      { action: "Suspended — Under Investigation", actor: "Shri R.K. Verma (DA)", timestamp: "2026-09-10T11:00:00Z", reason: "Suspended pending investigation into material quantity discrepancy. Physical verification ordered. Project work halted until further notice." },
    ]
  },
  {
    id: "PRJ-2026-020", mpId: "MP-004", mpName: "Dr. Meena Singh", constituency: "Lucknow West",
    title: "Solar Water Heater Installation — Schools", category: "Renewable Energy",
    description: "Installing solar water heaters in 10 government schools for mid-day meal program.",
    district: "Lucknow", estimatedCost: 800000, sanctionedAmount: 800000, amountSpent: 800000,
    status: "Completed", reviewStatus: "Sanctioned",
    startDate: "2025-04-01", expectedEndDate: "2025-08-31", actualEndDate: "2025-08-15", lastUpdated: "2025-09-01",
    vendor: "SunLight Technologies", vendorId: "V-002",
    implementingAgency: "Education Department", assignedImplementingAgency: "IA-003",
    riskScore: 8, riskLevel: "Low",
    riskFactors: [
      { detector: "Cost Anomaly", score: 5, explanation: "Well within benchmark." },
      { detector: "Timeline Delay", score: 0, explanation: "Completed ahead of schedule." },
      { detector: "Duplicate Work", score: 0, explanation: "No concern." },
      { detector: "Vendor Risk", score: 5, explanation: "Excellent vendor track record." }
    ],
    documents: [
      { id: "doc-36", name: "Installation_Certificate.pdf", type: "PDF", size: "1.1 MB", uploadDate: "2025-08-20", uploader: "Education Dept" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Dr. Meena Singh (MP)", timestamp: "2025-03-15T09:00:00Z", reason: "Green energy for school mid-day meals." },
      { action: "Sanctioned", actor: "Shri R.K. Verma (DA)", timestamp: "2025-03-28T11:00:00Z", reason: "Approved. Excellent initiative. IA: Education Dept." },
    ]
  },
  {
    id: "PRJ-2026-021", mpId: "MP-004", mpName: "Dr. Meena Singh", constituency: "Lucknow West",
    title: "Community Toilet Complex", category: "Sanitation",
    description: "Construction of a 20-seat community toilet complex near the bus stand area.",
    district: "Lucknow", estimatedCost: 950000, sanctionedAmount: 0, amountSpent: 0,
    status: "Pending Sanction", reviewStatus: "Pending Review",
    startDate: null, expectedEndDate: null, lastUpdated: "2026-09-18",
    vendor: "ABC Builders Pvt Ltd", vendorId: "V-001",
    implementingAgency: "Pending", assignedImplementingAgency: null,
    riskScore: 28, riskLevel: "Low",
    riskFactors: [
      { detector: "Cost Anomaly", score: 22, explanation: "Slightly above average but justified by location." },
      { detector: "Timeline Delay", score: 0, explanation: "Not yet started." },
      { detector: "Duplicate Work", score: 15, explanation: "No similar facility within 1km radius." },
      { detector: "Vendor Risk", score: 22, explanation: "ABC Builders — good track record." }
    ],
    documents: [
      { id: "doc-37", name: "Toilet_Complex_Proposal.pdf", type: "PDF", size: "1.8 MB", uploadDate: "2026-09-17", uploader: "MP Office" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Dr. Meena Singh (MP)", timestamp: "2026-09-17T14:00:00Z", reason: "Swachh Bharat initiative — public sanitation." },
    ]
  },
  {
    id: "PRJ-2026-022", mpId: "MP-004", mpName: "Dr. Meena Singh", constituency: "Lucknow West",
    title: "E-Rickshaw Charging Station", category: "Public Transport",
    description: "Setting up 3 e-rickshaw charging stations with 10 charging points each.",
    district: "Lucknow", estimatedCost: 1500000, sanctionedAmount: 0, amountSpent: 0,
    status: "Pending Sanction", reviewStatus: "Pending Review",
    startDate: null, expectedEndDate: null, lastUpdated: "2026-09-19",
    vendor: "Reliable Electricals", vendorId: "V-007",
    implementingAgency: "Pending", assignedImplementingAgency: null,
    riskScore: 65, riskLevel: "High",
    riskFactors: [
      { detector: "Cost Anomaly", score: 50, explanation: "Cost per charging point is above market rates." },
      { detector: "Timeline Delay", score: 0, explanation: "Not yet started." },
      { detector: "Duplicate Work", score: 20, explanation: "No concern." },
      { detector: "Vendor Risk", score: 85, explanation: "Reliable Electricals under investigation for circular sub-contracting." }
    ],
    documents: [
      { id: "doc-38", name: "Charging_Station_Proposal.pdf", type: "PDF", size: "2.3 MB", uploadDate: "2026-09-18", uploader: "MP Office" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Dr. Meena Singh (MP)", timestamp: "2026-09-18T11:00:00Z", reason: "Green transport infrastructure." },
    ]
  },

  // ────── MP-005: Shri Rajesh Tiwari (Lucknow Central) — 5 projects ──────
  {
    id: "PRJ-2026-023", mpId: "MP-005", mpName: "Shri Rajesh Tiwari", constituency: "Lucknow Central",
    title: "Heritage Building Restoration", category: "Community Infrastructure",
    description: "Restoration of the 100-year-old town hall building preserving its heritage architecture.",
    district: "Lucknow", estimatedCost: 8000000, sanctionedAmount: 8000000, amountSpent: 5500000,
    status: "In Progress", reviewStatus: "Sanctioned",
    startDate: "2025-01-01", expectedEndDate: "2026-06-30", lastUpdated: "2026-09-15",
    vendor: "ABC Builders Pvt Ltd", vendorId: "V-001",
    implementingAgency: "PWD — Public Works Department", assignedImplementingAgency: "IA-001",
    riskScore: 35, riskLevel: "Low",
    riskFactors: [
      { detector: "Cost Anomaly", score: 30, explanation: "Heritage restoration costs are inherently higher. Within acceptable range." },
      { detector: "Timeline Delay", score: 35, explanation: "Slightly behind schedule due to material sourcing for heritage-grade work." },
      { detector: "Duplicate Work", score: 0, explanation: "Unique project." },
      { detector: "Vendor Risk", score: 22, explanation: "ABC Builders has heritage restoration experience." }
    ],
    documents: [
      { id: "doc-39", name: "Heritage_Assessment.pdf", type: "PDF", size: "6.2 MB", uploadDate: "2024-12-10", uploader: "ASI" },
      { id: "doc-40", name: "Restoration_Plan.pdf", type: "PDF", size: "8.1 MB", uploadDate: "2024-12-20", uploader: "PWD" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Shri Rajesh Tiwari (MP)", timestamp: "2024-11-15T09:00:00Z", reason: "Heritage preservation and tourism promotion." },
      { action: "Sanctioned", actor: "Shri R.K. Verma (DA)", timestamp: "2024-12-28T16:00:00Z", reason: "Approved with ASI clearance. IA: PWD." },
    ]
  },
  {
    id: "PRJ-2026-024", mpId: "MP-005", mpName: "Shri Rajesh Tiwari", constituency: "Lucknow Central",
    title: "Smart Classroom Setup — 5 Schools", category: "Education",
    description: "Setting up smart classrooms with projectors, interactive boards, and tablets in 5 government schools.",
    district: "Lucknow", estimatedCost: 2000000, sanctionedAmount: 2000000, amountSpent: 2000000,
    status: "Completed", reviewStatus: "Sanctioned",
    startDate: "2025-06-01", expectedEndDate: "2025-12-31", actualEndDate: "2025-12-15", lastUpdated: "2026-01-05",
    vendor: "TechSupplies Inc", vendorId: "V-004",
    implementingAgency: "District IT Department", assignedImplementingAgency: "IA-005",
    riskScore: 14, riskLevel: "Low",
    riskFactors: [
      { detector: "Cost Anomaly", score: 10, explanation: "GeM portal rates verified." },
      { detector: "Timeline Delay", score: 0, explanation: "Completed ahead of schedule." },
      { detector: "Duplicate Work", score: 5, explanation: "No concern." },
      { detector: "Vendor Risk", score: 15, explanation: "TechSupplies — reliable vendor." }
    ],
    documents: [
      { id: "doc-41", name: "Smart_Classroom_Completion.pdf", type: "PDF", size: "2.4 MB", uploadDate: "2025-12-20", uploader: "IT Dept" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Shri Rajesh Tiwari (MP)", timestamp: "2025-05-15T10:00:00Z", reason: "Digital education initiative." },
      { action: "Sanctioned", actor: "Shri R.K. Verma (DA)", timestamp: "2025-05-28T14:00:00Z", reason: "Approved. IA: District IT Dept." },
    ]
  },
  {
    id: "PRJ-2026-025", mpId: "MP-005", mpName: "Shri Rajesh Tiwari", constituency: "Lucknow Central",
    title: "Public Wi-Fi Hotspot Installation", category: "Education",
    description: "Setting up free public Wi-Fi hotspots at 15 key locations including market, hospital, and bus stand.",
    district: "Lucknow", estimatedCost: 1200000, sanctionedAmount: 0, amountSpent: 0,
    status: "Pending Sanction", reviewStatus: "Pending Review",
    startDate: null, expectedEndDate: null, lastUpdated: "2026-09-19",
    vendor: "TechSupplies Inc", vendorId: "V-004",
    implementingAgency: "Pending", assignedImplementingAgency: null,
    riskScore: 20, riskLevel: "Low",
    riskFactors: [
      { detector: "Cost Anomaly", score: 15, explanation: "Reasonable for 15 hotspot locations." },
      { detector: "Timeline Delay", score: 0, explanation: "Not yet started." },
      { detector: "Duplicate Work", score: 10, explanation: "State government has separate Wi-Fi scheme — need to verify non-overlap." },
      { detector: "Vendor Risk", score: 15, explanation: "TechSupplies — reliable vendor." }
    ],
    documents: [
      { id: "doc-42", name: "WiFi_Proposal.pdf", type: "PDF", size: "1.6 MB", uploadDate: "2026-09-18", uploader: "MP Office" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Shri Rajesh Tiwari (MP)", timestamp: "2026-09-18T15:00:00Z", reason: "Digital India initiative — public internet access." },
    ]
  },
  {
    id: "PRJ-2026-026", mpId: "MP-005", mpName: "Shri Rajesh Tiwari", constituency: "Lucknow Central",
    title: "Footpath and Cycle Track — Ring Road", category: "Public Transport",
    description: "Construction of 3km dedicated footpath and cycle track along the inner ring road.",
    district: "Lucknow", estimatedCost: 2800000, sanctionedAmount: 0, amountSpent: 0,
    status: "Pending Sanction", reviewStatus: "Pending Review",
    startDate: null, expectedEndDate: null, lastUpdated: "2026-09-19",
    vendor: "Metro Infrastructure Corp", vendorId: "V-005",
    implementingAgency: "Pending", assignedImplementingAgency: null,
    riskScore: 52, riskLevel: "Moderate",
    riskFactors: [
      { detector: "Cost Anomaly", score: 42, explanation: "Cost per km is 20% above average but includes special paving." },
      { detector: "Timeline Delay", score: 0, explanation: "Not yet started." },
      { detector: "Duplicate Work", score: 15, explanation: "No concern." },
      { detector: "Vendor Risk", score: 72, explanation: "Metro Infrastructure Corp has been flagged for delays." }
    ],
    documents: [
      { id: "doc-43", name: "Cycle_Track_Proposal.pdf", type: "PDF", size: "3.8 MB", uploadDate: "2026-09-18", uploader: "MP Office" },
      { id: "doc-44", name: "Route_Map.pdf", type: "PDF", size: "2.1 MB", uploadDate: "2026-09-18", uploader: "PWD" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Shri Rajesh Tiwari (MP)", timestamp: "2026-09-18T16:30:00Z", reason: "Sustainable transport and pedestrian safety." },
    ]
  },
  {
    id: "PRJ-2026-027", mpId: "MP-005", mpName: "Shri Rajesh Tiwari", constituency: "Lucknow Central",
    title: "Cremation Ground Modernization", category: "Community Infrastructure",
    description: "Modernization of the municipal cremation ground with proper facilities, waiting area, and green space.",
    district: "Lucknow", estimatedCost: 1600000, sanctionedAmount: 1600000, amountSpent: 400000,
    status: "In Progress", reviewStatus: "Sanctioned",
    startDate: "2026-04-01", expectedEndDate: "2026-10-31", lastUpdated: "2026-09-15",
    vendor: "GreenBuild Solutions", vendorId: "V-006",
    implementingAgency: "Zila Parishad", assignedImplementingAgency: "IA-002",
    riskScore: 18, riskLevel: "Low",
    riskFactors: [
      { detector: "Cost Anomaly", score: 15, explanation: "Within normal range." },
      { detector: "Timeline Delay", score: 10, explanation: "On track." },
      { detector: "Duplicate Work", score: 0, explanation: "No concern." },
      { detector: "Vendor Risk", score: 8, explanation: "GreenBuild Solutions — excellent track record." }
    ],
    documents: [
      { id: "doc-45", name: "Modernization_Plan.pdf", type: "PDF", size: "2.7 MB", uploadDate: "2026-03-20", uploader: "Zila Parishad" }
    ],
    actionHistory: [
      { action: "Project Submitted", actor: "Shri Rajesh Tiwari (MP)", timestamp: "2026-03-10T09:00:00Z", reason: "Community facility improvement." },
      { action: "Sanctioned", actor: "Shri R.K. Verma (DA)", timestamp: "2026-03-28T15:00:00Z", reason: "Approved. IA: Zila Parishad." },
    ]
  },
];

// ─── DA-Specific Notifications ───

export const mockDaNotifications = [
  {
    id: "da-notif-1", type: "warning",
    message: "Project 'Upgradation of Govt Primary School' by MP Smt. Priya Gupta auto-flagged as Critical Risk. Cost anomaly 1.8x benchmark.",
    timestamp: "2026-09-19T10:30:00Z", read: false, projectId: "PRJ-2026-003"
  },
  {
    id: "da-notif-2", type: "info",
    message: "New project submitted by MP Shri Rajesh Tiwari: 'Public Wi-Fi Hotspot Installation' — awaiting your review.",
    timestamp: "2026-09-19T09:15:00Z", read: false, projectId: "PRJ-2026-025"
  },
  {
    id: "da-notif-3", type: "warning",
    message: "Vendor 'X Construction' flagged across 3 active projects this month. Pattern analysis suggests coordinated cost inflation.",
    timestamp: "2026-09-18T16:00:00Z", read: false, projectId: null
  },
  {
    id: "da-notif-4", type: "info",
    message: "New project submitted by MP Dr. Meena Singh: 'E-Rickshaw Charging Station' — High risk score (65). Pending your review.",
    timestamp: "2026-09-18T14:30:00Z", read: false, projectId: "PRJ-2026-022"
  },
  {
    id: "da-notif-5", type: "success",
    message: "Documents received from MP Smt. Priya Gupta for 'Drinking Water RO Plant' — water quality report submitted.",
    timestamp: "2026-09-18T11:00:00Z", read: true, projectId: "PRJ-2026-004"
  },
  {
    id: "da-notif-6", type: "warning",
    message: "Project 'Sports Ground Development' by MP Shri Vikram Yadav uses flagged vendor Metro Infrastructure Corp. Risk score: 72.",
    timestamp: "2026-09-17T15:30:00Z", read: true, projectId: "PRJ-2026-015"
  },
  {
    id: "da-notif-7", type: "info",
    message: "New project submitted by MP Smt. Priya Gupta: 'Women's Skill Development Center' — Low risk. Ready for review.",
    timestamp: "2026-09-16T10:00:00Z", read: true, projectId: "PRJ-2026-012"
  },
  {
    id: "da-notif-8", type: "success",
    message: "Project 'Village Road Blacktopping — Phase 2' successfully suspended. Investigation order issued to PWD.",
    timestamp: "2026-09-10T12:00:00Z", read: true, projectId: "PRJ-2026-019"
  },
  {
    id: "da-notif-9", type: "error",
    message: "Escalation alert: 'Anganwadi Center Renovation' escalated to State Nodal Authority. Awaiting response.",
    timestamp: "2026-09-05T17:00:00Z", read: true, projectId: "PRJ-2026-017"
  },
  {
    id: "da-notif-10", type: "info",
    message: "Monthly district report auto-generated. 11 projects pending review, 3 projects suspended. Download available.",
    timestamp: "2026-09-01T08:00:00Z", read: true, projectId: null
  },
];

// ─── DA-Specific AI Recommendations ───

export const mockDaRecommendations = [
  {
    id: "da-rec-1", type: "Vendor Alert", severity: "Critical",
    message: "Vendor 'X Construction' is active across 3 MPs' projects with an average risk score of 78. Cost anomalies detected in 4 of 8 total projects. Recommend a district-wide vendor review and temporary block on new sanctions involving this vendor.",
    relatedProjectIds: ["PRJ-2026-003", "PRJ-2026-006", "PRJ-2026-017"]
  },
  {
    id: "da-rec-2", type: "Cross-MP Pattern", severity: "High",
    message: "Vendor 'Reliable Electricals' appears to be registered under 3 different company names. Projects from MP Shri Vikram Yadav and MP Dr. Meena Singh both reference this vendor. Circular sub-contracting suspected.",
    relatedProjectIds: ["PRJ-2026-016", "PRJ-2026-022"]
  },
  {
    id: "da-rec-3", type: "Utilization Outlier", severity: "Medium",
    message: "MP Shri Rajesh Tiwari (Lucknow Central) has 38% fund utilization with 6 months remaining in fiscal year. Two other MPs are above 60%. Consider prioritizing review of Central constituency proposals.",
    relatedProjectIds: []
  },
  {
    id: "da-rec-4", type: "Review Backlog", severity: "Medium",
    message: "11 projects are currently pending your review. 3 have been waiting more than 5 days. Oldest: 'Public Park Renovation' submitted 5 days ago. Consider clearing backlog to avoid blocking MP development timelines.",
    relatedProjectIds: ["PRJ-2026-010"]
  },
  {
    id: "da-rec-5", type: "IA Performance", severity: "Low",
    message: "Health Department (IA-006) has an average completion time of 9.5 months — highest among all IAs. Consider reassigning new health projects to PHED or Zila Parishad for better outcomes.",
    relatedProjectIds: []
  },
];
