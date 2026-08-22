from pydantic import BaseModel, Field
from typing import List, Optional

class Scenario(BaseModel):
    event: str = Field(description="The event that triggered the analysis, e.g., 'developer_unavailable'")
    person_id: Optional[int] = Field(None, description="The ID of the user triggering the event")
    duration_hours: Optional[int] = Field(None, description="Duration in hours if the person is unavailable")
    task_id: Optional[int] = Field(None, description="The specific task ID being analyzed, if applicable")
    candidate_id: Optional[int] = Field(None, description="A candidate ID for taking over, if requested")

class InterventionOption(BaseModel):
    type: str = Field(description="The type of intervention (e.g., WAIT, REASSIGN, PAIR, AI_ASSIST, DE_SCOPE, PARALLELIZE)")
    score: float = Field(description="The calculated context/confidence score of this option (0.0 to 1.0)")
    estimated_completion: float = Field(description="Estimated delivery in days")
    risk: str = Field(description="Risk assessment (LOW, MEDIUM, HIGH)")
    deadline_probability: float = Field(description="Probability of hitting the deadline (0.0 to 1.0)")
    reason: List[str] = Field(description="List of reasons for this simulation outcome")

class Recommendation(BaseModel):
    recommended_action: str = Field(description="The selected intervention option type")
    reasoning_factors: List[str] = Field(description="Explanations for why this was chosen")
    tradeoffs: List[str] = Field(description="Tradeoffs compared to other options")
    confidence: float = Field(description="Confidence in this recommendation (0.0 to 1.0)")
    options: List[InterventionOption] = Field(description="All simulated options that were considered")
