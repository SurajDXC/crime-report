from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone


# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    phone: Optional[str] = None
    city: str = "Bhopal"
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = None
    city: str = "Bhopal"

class UserLogin(BaseModel):
    email: str
    password: str

class Comment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    report_id: str
    user_id: str
    user_name: str
    comment_text: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommentCreate(BaseModel):
    comment_text: str

class CredibilityRating(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    report_id: str
    user_id: str
    rating: int = Field(ge=0, le=10)  # 0-10 scale
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CredibilityRatingCreate(BaseModel):
    rating: int = Field(ge=0, le=10)

class CrimeReport(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    crime_type: str
    location: str
    landmark: Optional[str] = None
    crime_time: datetime
    criminal_name: Optional[str] = None
    crime_details: str
    is_anonymous: bool = False
    city: str = "Bhopal"
    image_base64: Optional[str] = None
    is_blocked: bool = False
    avg_credibility: float = 0.0
    total_ratings: int = 0
    comments_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CrimeReportCreate(BaseModel):
    crime_type: str
    location: str
    landmark: Optional[str] = None
    crime_time: datetime
    criminal_name: Optional[str] = None
    crime_details: str
    is_anonymous: bool = False

class CrimeType(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CrimeTypeCreate(BaseModel):
    name: str

class CrimeTypeUpdate(BaseModel):
    name: str

class ReportBlock(BaseModel):
    is_blocked: bool
    reason: Optional[str] = None
