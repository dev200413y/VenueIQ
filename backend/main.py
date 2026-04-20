"""
VenueIQ — FastAPI Backend
AI-powered Smart Venue Management Platform
Integrates: Gemini 1.5 Pro, Firebase, Cloud Pub/Sub, Cloud SQL
"""

import os
import json
import time
import random
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---- App Init ----
app = FastAPI(
    title="VenueIQ API",
    description="Smart Venue Management Platform — AI crowd intelligence backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Environment ----
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
FIREBASE_PROJECT_ID = os.environ.get("FIREBASE_PROJECT_ID", "")

# ---- Try importing Google AI ----
gemini_model = None
try:
    import google.generativeai as genai
    if GEMINI_API_KEY:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel("gemini-1.5-pro")
        print("✅ Gemini 1.5 Pro connected")
    else:
        print("⚠️  GEMINI_API_KEY not set — using mock responses")
except ImportError:
    print("⚠️  google-generativeai not installed — using mock responses")

# ---- Try importing Firebase ----
firebase_db = None
try:
    import firebase_admin
    from firebase_admin import credentials, db as firebase_db_module
    if FIREBASE_PROJECT_ID:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            'databaseURL': f'https://{FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com'
        })
        firebase_db = firebase_db_module
        print("✅ Firebase Realtime DB connected")
    else:
        print("⚠️  FIREBASE_PROJECT_ID not set — using mock data")
except ImportError:
    print("⚠️  firebase-admin not installed — using mock data")

# ---- Try importing Cloud Pub/Sub ----
pubsub_publisher = None
try:
    from google.cloud import pubsub_v1
    pubsub_publisher = pubsub_v1.PublisherClient()
    print("✅ Cloud Pub/Sub connected")
except Exception:
    print("⚠️  Cloud Pub/Sub not configured — using mock events")


# ============================================================
# DATA MODELS
# ============================================================

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = "admin"

class ChatResponse(BaseModel):
    reply: str
    timestamp: str
    source: str

class ZoneAnalysis(BaseModel):
    zone_id: str
    description: Optional[str] = ""

class QueuePrediction(BaseModel):
    queue_id: str

class AlertEvent(BaseModel):
    type: str  # crit, warn, info, ok
    title: str
    body: str


# ============================================================
# MOCK DATA (used when Google services not configured)
# ============================================================

ZONE_DATA = {
    "north": {"name": "North Stand", "density": 91, "status": "CRITICAL", "surge_risk": 87},
    "south": {"name": "South Stand", "density": 68, "status": "MODERATE", "surge_risk": 42},
    "east": {"name": "East Stand", "density": 38, "status": "NORMAL", "surge_risk": 12},
    "west": {"name": "West Stand", "density": 72, "status": "HIGH", "surge_risk": 54},
    "food_court": {"name": "Food Court", "density": 82, "status": "HIGH", "surge_risk": 78},
    "vip": {"name": "VIP Lounge", "density": 40, "status": "NORMAL", "surge_risk": 15},
}

QUEUE_DATA = {
    "gate_a": {"name": "Gate A Concessions", "wait_min": 13, "occupancy": 91, "status": "critical"},
    "gate_b": {"name": "Gate B Concessions", "wait_min": 2, "occupancy": 28, "status": "normal"},
    "food_court_a": {"name": "Food Court A", "wait_min": 10, "occupancy": 82, "status": "warning"},
    "vip_bar": {"name": "VIP Lounge Bar", "wait_min": 3, "occupancy": 40, "status": "normal"},
    "restroom_n1": {"name": "Restroom Block N1", "wait_min": 5, "occupancy": 80, "status": "warning"},
    "restroom_w2": {"name": "Restroom Block W2", "wait_min": 0, "occupancy": 22, "status": "normal"},
}

MOCK_CHAT_RESPONSES = {
    "restroom": "Restroom Block W2 (Level 1) has 0 min wait — only 22% occupancy. 2 min walk via West Corridor.",
    "food": "Gate B Concessions: 2 min wait vs 13 min at Gate A. Half-time rush in 8 min — go now!",
    "seat": "Route: Gate A → West Corridor (avoid North 89%) → West Elevator L3 → N-Block markers → Seat 34. ETA 4 min.",
    "north": "North Stand at 91% — CRITICAL. Gate A restricted. East Stand comfortable at 38% — use Gate D.",
    "half": "Half-time in 8 min. 34% surge predicted. Go to Gate B Concessions and Restroom W2 now.",
    "parking": "East Parking: 6 min wait (recommended). West Parking: 14 min. AI routing to staggered exits.",
    "default": "Live: North Stand 91% (critical), Gate A restricted. East/West clear. How can I help?",
}


# ============================================================
# HELPER: Get Gemini response or fallback to mock
# ============================================================

async def get_gemini_response(prompt: str) -> str:
    """Get response from Gemini 1.5 Pro or fall back to keyword matching."""
    if gemini_model:
        try:
            response = gemini_model.generate_content(
                f"""You are VenueIQ AI Assistant for a live sporting event at Grand Sports Arena.
Current conditions:
- North Stand: 91% density (CRITICAL), Gate A restricted
- South Stand: 68% (MODERATE)
- East Stand: 38% (NORMAL, accepting overflow)
- West Stand: 72% (HIGH)
- Food Court: 82% (HIGH, half-time surge in 8 min)
- Gate B & D: Open, 2-3 min wait
- Restroom W2: 0 min wait, 22% occupancy

User asks: {prompt}

Respond concisely with actionable venue guidance. Max 2 sentences."""
            )
            return response.text.strip()
        except Exception as e:
            print(f"Gemini error: {e}")

    # Fallback: keyword matching
    msg = prompt.lower()
    if any(w in msg for w in ["restroom", "toilet", "bathroom"]):
        return MOCK_CHAT_RESPONSES["restroom"]
    if any(w in msg for w in ["food", "eat", "queue", "concession"]):
        return MOCK_CHAT_RESPONSES["food"]
    if any(w in msg for w in ["seat", "route", "navigate", "guide"]):
        return MOCK_CHAT_RESPONSES["seat"]
    if "north" in msg:
        return MOCK_CHAT_RESPONSES["north"]
    if any(w in msg for w in ["half", "plan"]):
        return MOCK_CHAT_RESPONSES["half"]
    if "park" in msg:
        return MOCK_CHAT_RESPONSES["parking"]
    return MOCK_CHAT_RESPONSES["default"]


def publish_alert(alert_type: str, title: str, body: str):
    """Publish alert to Cloud Pub/Sub or log locally."""
    if pubsub_publisher and FIREBASE_PROJECT_ID:
        try:
            topic = f"projects/{FIREBASE_PROJECT_ID}/topics/venue-alerts"
            data = json.dumps({"type": alert_type, "title": title, "body": body}).encode("utf-8")
            pubsub_publisher.publish(topic, data)
        except Exception as e:
            print(f"Pub/Sub error: {e}")
    else:
        print(f"📢 Alert [{alert_type}]: {title} — {body}")


# ============================================================
# API ENDPOINTS
# ============================================================

@app.get("/")
async def root():
    return {
        "service": "VenueIQ API",
        "version": "1.0.0",
        "status": "live",
        "google_services": {
            "gemini": "connected" if gemini_model else "mock",
            "firebase": "connected" if firebase_db else "mock",
            "pubsub": "connected" if pubsub_publisher else "mock",
        }
    }


@app.get("/api/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# ---- Chat (Gemini 1.5 Pro) ----
@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    reply = await get_gemini_response(req.message)
    return ChatResponse(
        reply=reply,
        timestamp=datetime.utcnow().isoformat(),
        source="gemini" if gemini_model else "mock",
    )


# ---- Zone Analysis ----
@app.get("/api/zones")
async def get_zones():
    """Get all zone density data. Uses Firebase RT DB if connected."""
    if firebase_db:
        try:
            ref = firebase_db.reference("/venues/grand-sports-arena/zones")
            data = ref.get()
            if data:
                return {"zones": data, "source": "firebase"}
        except Exception as e:
            print(f"Firebase read error: {e}")
    return {"zones": ZONE_DATA, "source": "mock"}


@app.get("/api/zones/{zone_id}")
async def get_zone(zone_id: str):
    zone = ZONE_DATA.get(zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    return {**zone, "timestamp": datetime.utcnow().isoformat()}


@app.post("/api/analyze-zone")
async def analyze_zone(req: ZoneAnalysis):
    """AI analysis of a zone using Gemini Vision."""
    zone = ZONE_DATA.get(req.zone_id, {})
    prompt = f"Analyze crowd density for {zone.get('name', req.zone_id)}: {zone.get('density', 0)}% occupied. {req.description}"
    analysis = await get_gemini_response(prompt)
    return {
        "zone_id": req.zone_id,
        "zone": zone,
        "ai_analysis": analysis,
        "timestamp": datetime.utcnow().isoformat(),
    }


# ---- Queue Intelligence ----
@app.get("/api/queues")
async def get_queues():
    return {"queues": QUEUE_DATA, "timestamp": datetime.utcnow().isoformat()}


@app.post("/api/predict-queue")
async def predict_queue(req: QueuePrediction):
    queue = QUEUE_DATA.get(req.queue_id)
    if not queue:
        raise HTTPException(status_code=404, detail="Queue not found")
    # Simulate prediction
    prediction = {
        "current_wait": queue["wait_min"],
        "predicted_15min": max(0, queue["wait_min"] + random.randint(-3, 5)),
        "recommendation": await get_gemini_response(
            f"Queue {queue['name']} has {queue['wait_min']} min wait at {queue['occupancy']}% capacity. Predict and recommend."
        ),
    }
    return {**prediction, "queue_id": req.queue_id, "timestamp": datetime.utcnow().isoformat()}


# ---- Alerts ----
@app.get("/api/alerts")
async def get_alerts():
    return {
        "alerts": [
            {"type": "crit", "title": "North Stand — 91% density", "body": "Restrict Gate A. Rerouting to Gate D."},
            {"type": "warn", "title": "Food Court — half-time surge", "body": "34% increase in 8 min. Open backup stalls."},
            {"type": "info", "title": "Gate D overflow opened", "body": "North Stand curve flattening."},
            {"type": "ok", "title": "Medical Bay — all clear", "body": "No incidents. Staff ready."},
        ],
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/api/alerts")
async def create_alert(req: AlertEvent):
    publish_alert(req.type, req.title, req.body)
    return {"status": "published", "timestamp": datetime.utcnow().isoformat()}


# ---- Navigation ----
@app.get("/api/navigate")
async def get_navigation():
    return {
        "destination": "N-Block · Row 12 · Seat 34",
        "eta_min": 4,
        "ai_savings_min": 3,
        "steps": [
            {"title": "Current Location", "sub": "Concourse M, Gate A area", "status": "done"},
            {"title": "Head to West Corridor", "sub": "Avoid North Gate — 89% density", "status": "done"},
            {"title": "West Elevator → Level 3", "sub": "Accessible · 0 min wait", "status": "active"},
            {"title": "Follow N-Block signage", "sub": "Green floor arrows", "status": "upcoming"},
            {"title": "N-Block Row 12 Seat 34", "sub": "ETA 4 minutes", "status": "upcoming"},
        ],
        "timestamp": datetime.utcnow().isoformat(),
    }


# ---- Crowd Data (for live updates) ----
@app.get("/api/crowd")
async def get_crowd():
    """Live crowd metrics endpoint."""
    return {
        "total_capacity": 80000,
        "registered": 72450,
        "arrived": 67842 + random.randint(0, 50),
        "walk_in": 4200,
        "reroutes_issued": 1247 + random.randint(0, 20),
        "critical_zones": 2,
        "avg_queue_wait": 4.2,
        "incidents": 0,
        "timestamp": datetime.utcnow().isoformat(),
    }


# ---- Rate limiting middleware ----
request_counts: dict = {}

@app.middleware("http")
async def rate_limit(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()

    # Clean old entries
    request_counts[client_ip] = [t for t in request_counts.get(client_ip, []) if now - t < 60]

    if len(request_counts.get(client_ip, [])) > 100:  # 100 requests per minute
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    request_counts.setdefault(client_ip, []).append(now)
    response = await call_next(request)
    return response


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
