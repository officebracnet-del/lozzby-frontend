import os
from typing import Optional

from bson import ObjectId
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from pydantic import BaseModel

from database import db, products_collection


# =========================================================
# APP AND CORS
# =========================================================

app = FastAPI(title="Lozzby Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://lozzby-frontend.onrender.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.0.106:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# AUTH SETTINGS
# Set SECRET_KEY and ADMIN_PASSWORD as Render environment
# variables for production.
# =========================================================

SECRET_KEY = os.getenv("SECRET_KEY", "lozzby-secret-key-change-this")
ALGORITHM = "HS256"
ADMIN_USER = os.getenv("ADMIN_USER", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "01152008")


# =========================================================
# REQUEST MODELS
# =========================================================

class LoginRequest(BaseModel):
    username: str
    password: str


class Product(BaseModel):
    name: str
    price: float
    image: str = ""
    category: str = "Electronics"
    section: str = "Featured"


class OrderStatus(BaseModel):
    status: str


# =========================================================
# HOME / HEALTH CHECK
# =========================================================

@app.get("/")
def home():
    return {"message": "Lozzby Backend Running"}


@app.get("/health")
def health():
    return {"status": "ok"}


# =========================================================
# JWT AUTHENTICATION
# =========================================================

def create_token(username: str) -> str:
    payload = {"sub": username, "role": "admin"}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> str:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        role = payload.get("role")

        if username != ADMIN_USER or role != "admin":
            raise HTTPException(status_code=403, detail="Invalid admin token")