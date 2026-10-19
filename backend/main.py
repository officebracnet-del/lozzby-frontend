from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from jose import jwt, JWTError
from bson import ObjectId
from typing import Optional

from database import products_collection, db


# =========================================================
# APP
# =========================================================

app = FastAPI(title="Lozzby Backend")


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://192.168.0.106:3000",
        "https://lozzby-frontend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# JWT SETTINGS
# =========================================================

SECRET_KEY = "lozzby-secret-key-change-this"
ALGORITHM = "HS256"

ADMIN_USER = "admin"
ADMIN_PASSWORD = "01152008"


# =========================================================
# MODELS
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
# HOME
# =========================================================

@app.get("/")
def home():
    return {
        "message": "Lozzby Backend Running"
    }


# =========================================================
# JWT
# =========================================================

def create_token(username: str):

    payload = {
        "sub": username,
        "role": "admin"
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def verify_token(token: str):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        username = payload.get("sub")

        if username != ADMIN_USER:
            raise HTTPException(
                status_code=403,
                detail="Invalid admin"
            )

        return username

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )


async def admin_required(
    authorization: Optional[str] = Header(None)
):

    if not authorization:

        raise HTTPException(
            status_code=401,
            detail="Authorization required"
        )

    if not authorization.startswith("Bearer "):

        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header"
        )

    token = authorization.replace(
        "Bearer ",
        "",
        1
    ).strip()

    if not token:

        raise HTTPException(
            status_code=401,
            detail="Token missing"
        )

    return verify_token(token)


# =========================================================
# LOGIN
# =========================================================

@app.post("/admin/login")
def admin_login(data: LoginRequest):

    if (
        data.username != ADMIN_USER
        or data.password != ADMIN_PASSWORD
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    token = create_token(
        data.username
    )

    return {
        "message": "Login successful",
        "token": token
    }


# =========================================================
# PRODUCTS - GET
# =========================================================

@app.get("/products")
def get_products():

    try:

        products = list(
            products_collection.find({})
        )

        result = []

        for product in products:

            product["_id"] = str(
                product["_id"]
            )

            result.append(product)

        return result

    except Exception as error:

        print(
            "PRODUCT GET ERROR:",
            repr(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Could not load products"
        )


# =========================================================
# PRODUCTS - POST
# =========================================================

@app.post("/products")
def add_product(
    product: Product,
    admin=Depends(admin_required)
):

    try:

        existing = products_collection.find_one(
            {
                "name": product.name
            }
        )

        if existing:

            raise HTTPException(
                status_code=400,
                detail="Product with this name already exists"
            )

        new_product = {
            "name": product.name,
            "price": product.price,
            "image": product.image,
            "category": product.category,
            "section": product.section,
        }

        result = products_collection.insert_one(
            new_product
        )

        return {
            "message": "Product added successfully",
            "id": str(result.inserted_id)
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "PRODUCT ADD ERROR:",
            repr(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Could not add product"
        )


# =========================================================
# PRODUCTS - DELETE
# Supports MongoDB ID OR product name
# =========================================================

@app.delete("/products/{product_id}")
def delete_product(
    product_id: str,
    admin=Depends(admin_required)
):

    try:

        # Try MongoDB ObjectId first
        if ObjectId.is_valid(product_id):

            result = products_collection.delete_one(
                {
                    "_id": ObjectId(product_id)
                }
            )

        else:

            # Fallback to product name
            result = products_collection.delete_one(
                {
                    "name": product_id
                }
            )

        if result.deleted_count == 0:

            raise HTTPException(
                status_code=404,
                detail="Product not found"
            )

        return {
            "message": "Product deleted successfully"
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "PRODUCT DELETE ERROR:",
            repr(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Could not delete product"
        )


# =========================================================
# ORDERS COLLECTION
# =========================================================

orders_collection = db["orders"]


# =========================================================
# ORDERS - GET
# =========================================================

@app.get("/orders")
def get_orders(
    admin=Depends(admin_required)
):

    try:

        orders = list(
            orders_collection.find({})
        )

        result = []

        for order in orders:

            order["_id"] = str(
                order["_id"]
            )

            result.append(order)

        return result

    except Exception as error:

        print(
            "ORDER GET ERROR:",
            repr(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Could not load orders"
        )


# =========================================================
# ORDERS - UPDATE STATUS
# =========================================================

@app.put("/orders/{order_id}/status")
def update_order_status(
    order_id: str,
    data: OrderStatus,
    admin=Depends(admin_required)
):

    try:

        allowed_statuses = [
            "Pending",
            "Confirmed",
            "Processing",
            "Shipped",
            "Delivered",
            "Cancelled",
        ]

        if data.status not in allowed_statuses:

            raise HTTPException(
                status_code=400,
                detail="Invalid order status"
            )

        if ObjectId.is_valid(order_id):

            result = orders_collection.update_one(
                {
                    "_id": ObjectId(order_id)
                },
                {
                    "$set": {
                        "status": data.status
                    }
                }
            )

        else:

            result = orders_collection.update_one(
                {
                    "order_id": order_id
                },
                {
                    "$set": {
                        "status": data.status
                    }
                }
            )

        if result.matched_count == 0:

            raise HTTPException(
                status_code=404,
                detail="Order not found"
            )

        return {
            "message": "Order status updated",
            "status": data.status
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "ORDER STATUS ERROR:",
            repr(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Could not update order status"
        )


# =========================================================
# ORDERS - DELETE
# =========================================================

@app.delete("/orders/{order_id}")
def delete_order(
    order_id: str,
    admin=Depends(admin_required)
):

    try:

        if ObjectId.is_valid(order_id):

            result = orders_collection.delete_one(
                {
                    "_id": ObjectId(order_id)
                }
            )

        else:

            result = orders_collection.delete_one(
                {
                    "order_id": order_id
                }
            )

        if result.deleted_count == 0:

            raise HTTPException(
                status_code=404,
                detail="Order not found"
            )

        return {
            "message": "Order deleted successfully"
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "ORDER DELETE ERROR:",
            repr(error)
        )

        raise HTTPException(
            status_code=500,
            detail="Could not delete order"
        )