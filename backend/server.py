from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import re
import unicodedata
import secrets as _secrets
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import jwt
import bcrypt
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import uuid

import seed_data

# ---------- Config ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']          # solo desde el entorno, jamas hardcodeado
JWT_ALGORITHM = "HS256"                          # algoritmo fijo, validado explicitamente
ACCESS_TOKEN_MINUTES = int(os.environ.get('ACCESS_TOKEN_MINUTES', '30'))
REFRESH_TOKEN_DAYS = int(os.environ.get('REFRESH_TOKEN_DAYS', '7'))
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@automotoslp.com')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD')
IS_PROD = os.environ.get('ENV', 'production').lower() == 'production'
CORS_ORIGINS = [o.strip() for o in os.environ.get('CORS_ORIGINS', '').split(',') if o.strip()]

MAX_FAILED = 5
LOCKOUT_MINUTES = 15
PAGE_LIMIT_MAX = 100
PAGE_LIMIT_DEFAULT = 60

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_real_ip(request: Request) -> str:
    # Detras del ingress k8s el client.host es la IP del proxy: usamos el primer hop de X-Forwarded-For
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=get_real_ip)

app = FastAPI(
    docs_url=None if IS_PROD else "/docs",
    redoc_url=None if IS_PROD else "/redoc",
    openapi_url=None if IS_PROD else "/openapi.json",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

api_router = APIRouter(prefix="/api")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def new_id():
    return str(uuid.uuid4())


# ---------- Security helpers ----------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id, "email": email, "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id, "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _set_auth_cookies(response: Response, access: str, refresh: str):
    # SameSite=Lax: front y API comparten dominio -> bloquea CSRF cross-site en POSTs admin sin romper el login.
    response.set_cookie("access_token", access, httponly=True, secure=True,
                        samesite="lax", max_age=ACCESS_TOKEN_MINUTES * 60, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True,
                        samesite="lax", max_age=REFRESH_TOKEN_DAYS * 86400, path="/")


def _decode(token: str, expected_type: str) -> dict:
    # algoritmo fijo pasado explicitamente -> bloquea el ataque alg:none
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError("tipo de token invalido")
    return payload


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = _decode(token, "access")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="No autenticado")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except HTTPException:
        raise
    except Exception:
        # 401 limpio: no filtramos el motivo exacto de la falla
        raise HTTPException(status_code=401, detail="No autenticado")


async def get_current_admin(request: Request, user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="No autorizado")
    # Anti-CSRF: toda escritura admin exige header custom (un form cross-site no puede setearlo sin preflight).
    if request.method not in ("GET", "HEAD", "OPTIONS"):
        if request.headers.get("x-requested-with") != "XMLHttpRequest":
            raise HTTPException(status_code=403, detail="Solicitud no permitida")
    return user


# ---------- Auth models ----------
class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=200)


# ---------- Domain models (validacion estricta Pydantic) ----------
VEHICLE_SET = {"auto", "moto"}


class SubmissionCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    category: str = Field(min_length=1, max_length=50)
    vehicles: List[str] = Field(default_factory=list, max_length=5)
    zone: str = Field(min_length=1, max_length=80)
    whatsapp: str = Field(min_length=8, max_length=15, pattern=r"^\d+$")
    description: str = Field(default="", max_length=1000)
    services: List[str] = Field(default_factory=list, max_length=30)

    @field_validator("vehicles")
    @classmethod
    def _veh(cls, v):
        v = [x for x in v if x in VEHICLE_SET]
        if not v:
            raise ValueError("vehicles debe incluir 'auto' y/o 'moto'")
        return v

    @field_validator("services")
    @classmethod
    def _svc(cls, v):
        return [s[:60] for s in v if isinstance(s, str) and s.strip()][:30]


class ReviewCreate(BaseModel):
    businessId: str = Field(min_length=1, max_length=64)
    author: str = Field(min_length=1, max_length=80)
    stars: int = Field(ge=1, le=5)
    text: str = Field(default="", max_length=1000)
    photos: List[str] = Field(default_factory=list, max_length=10)


class ReplyCreate(BaseModel):
    text: str = Field(min_length=1, max_length=1000)


class RadarCreate(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    type: str = Field(default="movil", max_length=20)
    speed: Optional[int] = Field(default=None, ge=0, le=200)
    description: str = Field(default="", max_length=300)
    community: bool = True


class EventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    date: str = Field(min_length=1, max_length=20)
    location: str = Field(default="", max_length=120)
    type: str = Field(min_length=1, max_length=30)
    description: str = Field(default="", max_length=500)


class CameraModel(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    type: str = Field(min_length=1, max_length=30)
    address: str = Field(min_length=1, max_length=160)
    direction: str = Field(default="", max_length=60)


class PlaceModel(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    kind: str = Field(min_length=1, max_length=40)
    zone: str = Field(default="", max_length=80)
    lat: Optional[float] = Field(default=None, ge=-90, le=90)
    lng: Optional[float] = Field(default=None, ge=-180, le=180)


class SiteModel(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    zone: str = Field(default="", max_length=80)
    enabled: bool = True
    description: str = Field(default="", max_length=500)


class DesvioModel(BaseModel):
    street: str = Field(min_length=1, max_length=120)
    type: str = Field(min_length=1, max_length=40)
    description: str = Field(default="", max_length=500)
    lat: Optional[float] = Field(default=None, ge=-90, le=90)
    lng: Optional[float] = Field(default=None, ge=-180, le=180)


# ---------- Helpers ----------
def derive_verified(b: dict) -> dict:
    b["verified"] = len(b.get("photos") or []) > 0 and (b.get("reviewsCount") or 0) > 0
    return b


def strip_accents(s: str) -> str:
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')


STOPWORDS = {"de", "la", "el", "los", "las", "y", "en", "para", "por", "con", "un", "una", "del", "al"}


def norm_tokens(s: str):
    s = strip_accents((s or "").lower())
    words = re.findall(r"[a-z0-9]+", s)
    return [w[:5] for w in words if w not in STOPWORDS]


# ---------- Auth endpoints ----------
async def _locked_out(identifier: str) -> bool:
    rec = await db.login_attempts.find_one({"identifier": identifier})
    if not rec:
        return False
    if rec.get("count", 0) >= MAX_FAILED:
        last = rec.get("last")
        if last and datetime.now(timezone.utc) - datetime.fromisoformat(last) < timedelta(minutes=LOCKOUT_MINUTES):
            return True
        await db.login_attempts.delete_one({"identifier": identifier})
    return False


async def _register_fail(identifier: str):
    await db.login_attempts.update_one(
        {"identifier": identifier},
        {"$inc": {"count": 1}, "$set": {"last": now_iso()}},
        upsert=True,
    )


@api_router.post("/auth/login")
@limiter.limit("10/minute")
async def login(request: Request, response: Response, body: LoginInput):
    email = body.email.lower().strip()
    identifier = f"{get_real_ip(request)}:{email}"
    if await _locked_out(identifier):
        raise HTTPException(status_code=429, detail="Demasiados intentos. Reintentá en unos minutos.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        await _register_fail(identifier)
        raise HTTPException(status_code=401, detail="Credenciales invalidas")
    await db.login_attempts.delete_one({"identifier": identifier})
    uid = str(user["_id"])
    _set_auth_cookies(response, create_access_token(uid, email), create_refresh_token(uid))
    return {"id": uid, "email": email, "name": user.get("name", ""), "role": user.get("role", "admin")}


@api_router.post("/auth/logout")
async def logout(response: Response, _: dict = Depends(get_current_user)):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"id": user["_id"], "email": user["email"], "name": user.get("name", ""), "role": user.get("role", "admin")}


@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = _decode(token, "refresh")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="No autenticado")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="No autenticado")
    uid = str(user["_id"])
    _set_auth_cookies(response, create_access_token(uid, user["email"]), create_refresh_token(uid))
    return {"ok": True}


# ---------- Public endpoints ----------
@api_router.get("/")
async def root():
    return {"message": "AUTOMOTOS L.P. API", "status": "ok"}


@api_router.get("/businesses")
async def get_businesses(
    vehicle: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = PAGE_LIMIT_DEFAULT,
    skip: int = 0,
):
    limit = max(1, min(limit, PAGE_LIMIT_MAX))   # paginacion obligatoria con tope duro
    skip = max(0, skip)
    q = {"status": "approved"}
    if category:
        q["category"] = category
    if vehicle:
        q["vehicles"] = vehicle
    items = await db.businesses.find(q, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    items = [derive_verified(b) for b in items]
    items.sort(key=lambda b: (not b.get("highlighted"), -(b.get("rating") or 0)))
    return items


@api_router.get("/businesses/{bid}")
async def get_business(bid: str):
    b = await db.businesses.find_one({"id": bid}, {"_id": 0})
    if not b:
        raise HTTPException(status_code=404, detail="No encontrado")
    b = derive_verified(b)
    reviews = await db.reviews.find({"businessId": bid}, {"_id": 0}).to_list(200)
    reviews.sort(key=lambda r: r.get("createdAt", ""), reverse=True)
    b["reviews"] = reviews
    return b


@api_router.get("/search")
async def search(q: str = ""):
    terms = norm_tokens(q[:80])
    items = await db.businesses.find({"status": "approved"}, {"_id": 0}).limit(300).to_list(300)
    results = []
    for b in items:
        hay = set()
        hay.update(norm_tokens(b.get("name", "")))
        hay.update(norm_tokens(b.get("category", "")))
        hay.update(norm_tokens(b.get("zone", "")))
        for s in b.get("services", []):
            hay.update(norm_tokens(s))
        if not terms or all(any(t == h or h.startswith(t) or t.startswith(h) for h in hay) for t in terms):
            results.append(derive_verified(b))
    return results


@api_router.post("/submissions")
@limiter.limit("5/minute")
async def create_submission(request: Request, sub: SubmissionCreate):
    doc = sub.model_dump()
    doc.update({
        "id": new_id(), "highlighted": False, "rating": 0.0, "reviewsCount": 0,
        "photos": [], "status": "pending", "createdAt": now_iso(),
    })
    await db.businesses.insert_one(doc)
    return {"ok": True, "id": doc["id"]}


@api_router.post("/reviews")
@limiter.limit("10/minute")
async def create_review(request: Request, rev: ReviewCreate):
    b = await db.businesses.find_one({"id": rev.businessId})
    if not b:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    doc = rev.model_dump()
    doc.update({"id": new_id(), "reply": None, "createdAt": now_iso()})
    await db.reviews.insert_one(doc)
    old_count = b.get("reviewsCount") or 0
    old_rating = b.get("rating") or 0.0
    new_count = old_count + 1
    new_rating = round((old_rating * old_count + rev.stars) / new_count, 1)
    await db.businesses.update_one({"id": rev.businessId}, {"$set": {"reviewsCount": new_count, "rating": new_rating}})
    return {"ok": True}


@api_router.post("/reviews/{rid}/reply")
async def reply_review(rid: str, reply: ReplyCreate, _: dict = Depends(get_current_admin)):
    r = await db.reviews.find_one({"id": rid})
    if not r:
        raise HTTPException(status_code=404, detail="Resena no encontrada")
    await db.reviews.update_one({"id": rid}, {"$set": {"reply": {"text": reply.text, "createdAt": now_iso()}}})
    return {"ok": True}


@api_router.get("/radars")
async def get_radars():
    return await db.radars.find({}, {"_id": 0}).limit(500).to_list(500)


@api_router.post("/radars")
@limiter.limit("10/minute")
async def create_radar(request: Request, r: RadarCreate):
    doc = r.model_dump()
    doc.update({"id": new_id(), "createdAt": now_iso()})
    await db.radars.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.get("/fuel-points")
async def get_fuel():
    return await db.fuel_points.find({}, {"_id": 0}).limit(500).to_list(500)


@api_router.get("/cameras")
async def get_cameras():
    return await db.cameras.find({}, {"_id": 0}).limit(500).to_list(500)


@api_router.get("/events")
async def get_events():
    items = await db.events.find({}, {"_id": 0}).limit(500).to_list(500)
    items.sort(key=lambda e: e.get("date", ""))
    return items


@api_router.get("/places")
async def get_places():
    return await db.places.find({}, {"_id": 0}).limit(500).to_list(500)


@api_router.get("/sites")
async def get_sites():
    return await db.sites.find({}, {"_id": 0}).limit(500).to_list(500)


@api_router.get("/desvios")
async def get_desvios():
    return await db.desvios.find({}, {"_id": 0}).limit(500).to_list(500)


# ---------- Admin endpoints (protegidos por JWT + rol admin) ----------
@api_router.get("/admin/verify")
async def admin_verify(_: dict = Depends(get_current_admin)):
    return {"ok": True}


@api_router.get("/admin/submissions")
async def admin_submissions(_: dict = Depends(get_current_admin)):
    return await db.businesses.find({"status": "pending"}, {"_id": 0}).to_list(1000)


@api_router.post("/admin/submissions/{sid}/approve")
async def approve_submission(sid: str, _: dict = Depends(get_current_admin)):
    res = await db.businesses.update_one({"id": sid}, {"$set": {"status": "approved"}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="No encontrado")
    return {"ok": True}


@api_router.delete("/admin/submissions/{sid}")
async def delete_submission(sid: str, _: dict = Depends(get_current_admin)):
    await db.businesses.delete_one({"id": sid})
    return {"ok": True}


@api_router.post("/admin/businesses/{bid}/verify")
async def force_verify(bid: str, _: dict = Depends(get_current_admin)):
    await db.businesses.update_one({"id": bid}, {"$set": {"highlighted": True}})
    return {"ok": True}


@api_router.post("/admin/events")
async def add_event(e: EventCreate, _: dict = Depends(get_current_admin)):
    doc = e.model_dump()
    doc.update({"id": new_id(), "createdAt": now_iso()})
    await db.events.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.delete("/admin/events/{eid}")
async def del_event(eid: str, _: dict = Depends(get_current_admin)):
    await db.events.delete_one({"id": eid})
    return {"ok": True}


@api_router.delete("/admin/radars/{rid}")
async def del_radar(rid: str, _: dict = Depends(get_current_admin)):
    await db.radars.delete_one({"id": rid})
    return {"ok": True}


# generic CRUD factory for cameras / places / sites / desvios
def make_crud(collection: str, model):
    @api_router.post(f"/admin/{collection}")
    async def _create(item: model, _: dict = Depends(get_current_admin)):  # type: ignore
        doc = item.model_dump()
        doc.update({"id": new_id(), "createdAt": now_iso()})
        await db[collection].insert_one(doc)
        doc.pop("_id", None)
        return doc

    @api_router.put(f"/admin/{collection}/{{item_id}}")
    async def _update(item_id: str, item: model, _: dict = Depends(get_current_admin)):  # type: ignore
        res = await db[collection].update_one({"id": item_id}, {"$set": item.model_dump()})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="No encontrado")
        return {"ok": True}

    @api_router.delete(f"/admin/{collection}/{{item_id}}")
    async def _delete(item_id: str, _: dict = Depends(get_current_admin)):  # type: ignore
        await db[collection].delete_one({"id": item_id})
        return {"ok": True}


make_crud("cameras", CameraModel)
make_crud("places", PlaceModel)
make_crud("sites", SiteModel)
make_crud("desvios", DesvioModel)


# ---------- Seed ----------
async def seed_collection(name: str, rows: list, with_created=True):
    if await db[name].count_documents({}) > 0:
        return
    docs = []
    for r in rows:
        d = dict(r)
        d["id"] = new_id()
        if with_created:
            d["createdAt"] = now_iso()
        docs.append(d)
    if docs:
        await db[name].insert_many(docs)
    logger.info(f"Seeded {name}: {len(docs)}")


async def seed_admin():
    if not ADMIN_PASSWORD:
        logger.warning("ADMIN_PASSWORD no configurada; se omite el seed del admin")
        return
    existing = await db.users.find_one({"email": ADMIN_EMAIL.lower()})
    if existing is None:
        await db.users.insert_one({
            "email": ADMIN_EMAIL.lower(), "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Admin", "role": "admin", "created_at": now_iso(),
        })
        logger.info("Admin creado")
    elif not verify_password(ADMIN_PASSWORD, existing.get("password_hash", "")):
        await db.users.update_one({"email": ADMIN_EMAIL.lower()},
                                  {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}})
        logger.info("Admin password actualizada")


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await seed_collection("radars", seed_data.SEED_RADARS)
    await seed_collection("fuel_points", seed_data.SEED_FUEL, with_created=False)
    await seed_collection("events", seed_data.SEED_EVENTS)
    await seed_collection("cameras", seed_data.SEED_CAMERAS)
    await seed_collection("places", seed_data.SEED_PLACES)
    await seed_collection("sites", seed_data.SEED_SITES)
    await seed_collection("desvios", seed_data.SEED_DESVIOS)
    await seed_admin()


app.include_router(api_router)


# ---------- Security headers ----------
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    response.headers["Permissions-Policy"] = "geolocation=(self), microphone=(), camera=()"
    return response


# CORS restringido al/los dominios reales (nunca "*" junto a credenciales)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS or ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
)


# No filtrar stacktraces en produccion
@app.exception_handler(Exception)
async def unhandled_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.url.path}: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Error interno del servidor"})


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
