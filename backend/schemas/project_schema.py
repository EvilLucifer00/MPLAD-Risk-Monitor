from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

class ProjectRiskLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ProjectStatus(str, Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    APPROVED = "APPROVED" 
    REJECTED = "REJECTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ESCALATED = "ESCALATED"

class ProjectType(str, Enum):
    COMMUNITY_INFRASTRUCTURE = "COMMUNITY_INFRASTRUCTURE"
    EDUCATION = "EDUCATION"
    HEALTH = "HEALTH"
    WATER_SUPPLY = "WATER_SUPPLY"
    PUBLIC_TRANSPORT = "PUBLIC_TRANSPORT"


class ProjectBase(BaseModel):
    id: int
    state: str
    mp_id: int
    dm_id: Optional[int] = None
    district: str
    constituency: str
    project_title: str
    category: str
    estimated_cost: float
    description: str
    submit_date: date
    document_link: Optional[str] = None
    risk_score: Optional[float] = None
    implementing_agency: str
    status: Optional[ProjectStatus] = None
    risk_level: Optional[ProjectRiskLevel] = None
    
    # Additional risk columns
    cost_anomaly_risk: Optional[float] = None
    timeline_delay_risk: Optional[float] = None
    duplicate_work_risk: Optional[float] = None
    vendor_risk: Optional[float] = None
    
    # Financials & Timelines
    sanctioned_amount: Optional[float] = None
    utilized_amount: Optional[float] = None
    unspent_balance: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    
    # Vendor & Geo
    vendor_name: Optional[str] = None
    vendor_id: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    active_projects: int
    funds_utilized_cr: float
    funds_entitlement_cr: float
    high_risk_projects: int
    pending_approvals: int
    total_projects: int
    status_breakdown: dict
    recent_projects: List[dict]

class ReportSummary(BaseModel):
    by_category: List[dict]
    cumulative_utilization: List[dict]


class NewProject(BaseModel):
    project_title: str
    category: ProjectType
    estimated_cost: float
    district: str
    constituency: str
    implementing_agency: str
    description: str 
    document_link: Optional[str] = None