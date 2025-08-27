from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
import bcrypt
import base64
from PIL import Image
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-here')
JWT_ALGORITHM = "HS256"

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

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

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, is_admin: bool = False) -> str:
    payload = {
        "user_id": user_id,
        "is_admin": is_admin,
        "exp": datetime.now(timezone.utc).timestamp() + 86400  # 24 hours
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def compress_image(image_base64: str, max_size_mb: int = 2) -> str:
    """Compress image to ensure it's under the size limit"""
    try:
        # Decode base64
        image_data = base64.b64decode(image_base64)
        img = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        
        # Start with high quality
        quality = 85
        output = io.BytesIO()
        
        while quality > 10:
            output.seek(0)
            output.truncate()
            img.save(output, format='JPEG', quality=quality)
            
            # Check size
            size_mb = len(output.getvalue()) / (1024 * 1024)
            if size_mb <= max_size_mb:
                break
            quality -= 10
        
        # Encode back to base64
        compressed_base64 = base64.b64encode(output.getvalue()).decode('utf-8')
        return compressed_base64
    except Exception as e:
        logging.error(f"Image compression error: {e}")
        return image_base64  # Return original if compression fails

async def update_report_stats(report_id: str):
    """Update report credibility and comment counts"""
    # Update credibility average
    ratings = await db.credibility_ratings.find({"report_id": report_id}).to_list(length=None)
    if ratings:
        avg_rating = sum(r["rating"] for r in ratings) / len(ratings)
        total_ratings = len(ratings)
    else:
        avg_rating = 0.0
        total_ratings = 0
    
    # Update comment count
    comments_count = await db.comments.count_documents({"report_id": report_id})
    
    # Update the report
    await db.crime_reports.update_one(
        {"id": report_id},
        {"$set": {
            "avg_credibility": round(avg_rating, 1),
            "total_ratings": total_ratings,
            "comments_count": comments_count
        }}
    )

# Initialize crime types
async def init_crime_types():
    existing_types = await db.crime_types.count_documents({})
    if existing_types == 0:
        crime_types = [
            "Forced Conversion (Love Jihad)",
            "Illegal Trafficking", 
            "Illegal Animal Trafficking",
            "Illegal Drug"
        ]
        
        for crime_type in crime_types:
            crime_type_obj = CrimeType(name=crime_type)
            await db.crime_types.insert_one(crime_type_obj.dict())

# Initialize admin user
async def init_admin():
    admin_exists = await db.users.find_one({"is_admin": True})
    if not admin_exists:
        admin_user = User(
            name="Admin",
            email="admin@crimereport.com",
            city="Bhopal",
            is_admin=True
        )
        admin_dict = admin_user.dict()
        admin_dict["password"] = hash_password("Asdf123$")  # Updated admin password
        await db.users.insert_one(admin_dict)
    else:
        # Update existing admin password
        await db.users.update_one(
            {"is_admin": True},
            {"$set": {"password": hash_password("Asdf123$")}}
        )

# Authentication Routes
@api_router.post("/register")
async def register_user(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = User(**user_data.dict(exclude={'password'}))
    user_dict = user.dict()
    user_dict["password"] = hash_password(user_data.password)
    
    await db.users.insert_one(user_dict)
    
    # Generate token
    token = create_jwt_token(user.id, user.is_admin)
    
    return {
        "message": "User registered successfully",
        "token": token,
        "user": user
    }

@api_router.post("/login")
async def login_user(login_data: UserLogin):
    # Find user
    user_doc = await db.users.find_one({"email": login_data.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(login_data.password, user_doc["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**user_doc)
    token = create_jwt_token(user.id, user.is_admin)
    
    return {
        "message": "Login successful",
        "token": token,
        "user": user
    }

@api_router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# Crime Types Routes
@api_router.get("/crime-types", response_model=List[CrimeType])
async def get_crime_types():
    crime_types = await db.crime_types.find().to_list(1000)
    return [CrimeType(**ct) for ct in crime_types]

# Admin Crime Types Management
@api_router.post("/admin/crime-types", response_model=CrimeType)
async def create_crime_type(
    crime_type_data: CrimeTypeCreate,
    admin_user: User = Depends(get_admin_user)
):
    # Check if crime type already exists
    existing = await db.crime_types.find_one({"name": crime_type_data.name})
    if existing:
        raise HTTPException(status_code=400, detail="Crime type already exists")
    
    crime_type = CrimeType(**crime_type_data.dict())
    await db.crime_types.insert_one(crime_type.dict())
    
    return crime_type

@api_router.put("/admin/crime-types/{crime_type_id}", response_model=CrimeType)
async def update_crime_type(
    crime_type_id: str,
    crime_type_data: CrimeTypeUpdate,
    admin_user: User = Depends(get_admin_user)
):
    # Check if crime type exists
    existing = await db.crime_types.find_one({"id": crime_type_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Crime type not found")
    
    # Update crime type
    await db.crime_types.update_one(
        {"id": crime_type_id},
        {"$set": {"name": crime_type_data.name}}
    )
    
    updated_doc = await db.crime_types.find_one({"id": crime_type_id})
    return CrimeType(**updated_doc)

@api_router.delete("/admin/crime-types/{crime_type_id}")
async def delete_crime_type(
    crime_type_id: str,
    admin_user: User = Depends(get_admin_user)
):
    # Check if crime type exists
    existing = await db.crime_types.find_one({"id": crime_type_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Crime type not found")
    
    # Delete crime type
    await db.crime_types.delete_one({"id": crime_type_id})
    
    return {"message": "Crime type deleted successfully"}

# Crime Reports Routes
@api_router.post("/crime-reports")
async def create_crime_report(
    crime_data: str = Form(...),
    image: UploadFile = File(None),
    current_user: User = Depends(get_current_user)
):
    import json
    try:
        crime_dict = json.loads(crime_data)
        crime_report_data = CrimeReportCreate(**crime_dict)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON data")
    
    # Handle image upload
    image_base64 = None
    if image:
        # Check file size (2MB limit)
        content = await image.read()
        if len(content) > 2 * 1024 * 1024:  # 2MB
            raise HTTPException(status_code=400, detail="Image size must be less than 2MB")
        
        # Convert to base64 and compress
        image_base64 = base64.b64encode(content).decode('utf-8')
        image_base64 = compress_image(image_base64)
    
    # Create crime report
    user_name = "Anonymous" if crime_report_data.is_anonymous else current_user.name
    
    crime_report = CrimeReport(
        **crime_report_data.dict(),
        user_id=current_user.id,
        user_name=user_name,
        city=current_user.city,
        image_base64=image_base64
    )
    
    await db.crime_reports.insert_one(crime_report.dict())
    
    return {
        "message": "Crime report submitted successfully",
        "report": crime_report
    }

@api_router.get("/crime-reports", response_model=List[CrimeReport])
async def get_crime_reports(
    city: str = "Bhopal",
    crime_type: Optional[str] = None,
    location: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20
):
    # Build query - exclude blocked posts for regular users
    query = {"city": city, "is_blocked": False}
    
    if crime_type:
        query["crime_type"] = crime_type
    
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    
    if search:
        query["$or"] = [
            {"crime_details": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}},
            {"criminal_name": {"$regex": search, "$options": "i"}},
            {"landmark": {"$regex": search, "$options": "i"}}
        ]
    
    # Get reports with pagination
    reports = await db.crime_reports.find(query)\
        .sort("created_at", -1)\
        .skip(skip)\
        .limit(limit)\
        .to_list(length=None)
    
    return [CrimeReport(**report) for report in reports]

@api_router.get("/crime-reports/{report_id}", response_model=CrimeReport)
async def get_crime_report_by_id(report_id: str):
    report = await db.crime_reports.find_one({"id": report_id})
    if not report:
        raise HTTPException(status_code=404, detail="Crime report not found")
    
    if report.get("is_blocked", False):
        raise HTTPException(status_code=404, detail="This report has been blocked")
    
    return CrimeReport(**report)

# Admin Report Management
@api_router.put("/admin/crime-reports/{report_id}/block")
async def block_crime_report(
    report_id: str,
    block_data: ReportBlock,
    admin_user: User = Depends(get_admin_user)
):
    # Check if report exists
    existing = await db.crime_reports.find_one({"id": report_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Crime report not found")
    
    # Update block status
    await db.crime_reports.update_one(
        {"id": report_id},
        {"$set": {"is_blocked": block_data.is_blocked}}
    )
    
    action = "blocked" if block_data.is_blocked else "unblocked"
    return {"message": f"Crime report {action} successfully"}

@api_router.get("/admin/crime-reports", response_model=List[CrimeReport])
async def get_all_crime_reports_admin(
    admin_user: User = Depends(get_admin_user),
    skip: int = 0,
    limit: int = 50
):
    # Admin can see all reports including blocked ones
    reports = await db.crime_reports.find({})\
        .sort("created_at", -1)\
        .skip(skip)\
        .limit(limit)\
        .to_list(length=None)
    
    return [CrimeReport(**report) for report in reports]

# Comments Routes
@api_router.post("/crime-reports/{report_id}/comments", response_model=Comment)
async def add_comment(
    report_id: str,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if report exists and not blocked
    report = await db.crime_reports.find_one({"id": report_id, "is_blocked": False})
    if not report:
        raise HTTPException(status_code=404, detail="Crime report not found")
    
    comment = Comment(
        report_id=report_id,
        user_id=current_user.id,
        user_name=current_user.name,
        comment_text=comment_data.comment_text
    )
    
    await db.comments.insert_one(comment.dict())
    await update_report_stats(report_id)
    
    return comment

@api_router.get("/crime-reports/{report_id}/comments", response_model=List[Comment])
async def get_comments(report_id: str, skip: int = 0, limit: int = 50):
    # Check if report exists and not blocked
    report = await db.crime_reports.find_one({"id": report_id, "is_blocked": False})
    if not report:
        raise HTTPException(status_code=404, detail="Crime report not found")
    
    comments = await db.comments.find({"report_id": report_id})\
        .sort("created_at", 1)\
        .skip(skip)\
        .limit(limit)\
        .to_list(length=None)
    
    return [Comment(**comment) for comment in comments]

# Credibility Rating Routes
@api_router.post("/crime-reports/{report_id}/rating")
async def rate_credibility(
    report_id: str,
    rating_data: CredibilityRatingCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if report exists and not blocked
    report = await db.crime_reports.find_one({"id": report_id, "is_blocked": False})
    if not report:
        raise HTTPException(status_code=404, detail="Crime report not found")
    
    # Check if user already rated this report
    existing_rating = await db.credibility_ratings.find_one({
        "report_id": report_id,
        "user_id": current_user.id
    })
    
    if existing_rating:
        # Update existing rating
        await db.credibility_ratings.update_one(
            {"report_id": report_id, "user_id": current_user.id},
            {"$set": {"rating": rating_data.rating}}
        )
        message = "Rating updated successfully"
    else:
        # Create new rating
        rating = CredibilityRating(
            report_id=report_id,
            user_id=current_user.id,
            rating=rating_data.rating
        )
        await db.credibility_ratings.insert_one(rating.dict())
        message = "Rating added successfully"
    
    await update_report_stats(report_id)
    
    return {"message": message}

@api_router.get("/crime-reports/{report_id}/rating")
async def get_user_rating(
    report_id: str,
    current_user: User = Depends(get_current_user)
):
    rating = await db.credibility_ratings.find_one({
        "report_id": report_id,
        "user_id": current_user.id
    })
    
    if rating:
        return {"rating": rating["rating"]}
    else:
        return {"rating": None}

@api_router.get("/")
async def root():
    return {"message": "Crime Reporting API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    await init_crime_types()
    await init_admin()

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()