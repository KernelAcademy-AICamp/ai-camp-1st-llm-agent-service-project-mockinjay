from pydantic import BaseModel
from typing import Optional
from datetime import date

class HealthRecordCreate(BaseModel):
    date: str
    hospital: str
    creatinine: float
    gfr: float
    potassium: Optional[float] = None
    phosphorus: Optional[float] = None
    hemoglobin: Optional[float] = None
    albumin: Optional[float] = None
    pth: Optional[float] = None
    hco3: Optional[float] = None
    memo: Optional[str] = None

class HealthRecordUpdate(BaseModel):
    date: Optional[str] = None
    hospital: Optional[str] = None
    creatinine: Optional[float] = None
    gfr: Optional[float] = None
    potassium: Optional[float] = None
    phosphorus: Optional[float] = None
    hemoglobin: Optional[float] = None
    albumin: Optional[float] = None
    pth: Optional[float] = None
    hco3: Optional[float] = None
    memo: Optional[str] = None

class HealthRecordResponse(BaseModel):
    id: str
    user_id: str
    date: str
    hospital: str
    creatinine: float
    gfr: float
    potassium: Optional[float] = None
    phosphorus: Optional[float] = None
    hemoglobin: Optional[float] = None
    albumin: Optional[float] = None
    pth: Optional[float] = None
    hco3: Optional[float] = None
    memo: Optional[str] = None
