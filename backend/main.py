import os, datetime as dt
from decimal import Decimal
from typing import Optional
from fastapi import FastAPI, APIRouter, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, String, ForeignKey, Numeric, Date, Boolean, select
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker, Session

engine = create_engine(os.getenv("DATABASE_URL", "postgresql+psycopg2://khata:khata@localhost:5432/khata"), pool_pre_ping=True)
SessionLocal = sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase): pass
class Category(Base):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(60), unique=True)
class Product(Base):
    __tablename__ = "products"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120)); brand: Mapped[str] = mapped_column(String(80), default="")
    category_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    unit: Mapped[str] = mapped_column(String(30), default="piece")
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2)); active: Mapped[bool] = mapped_column(Boolean, default=True)
    category: Mapped[Optional[Category]] = relationship(lazy="joined")
class Purchase(Base):
    __tablename__ = "purchases"
    id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[dt.date] = mapped_column(Date, index=True); note: Mapped[str] = mapped_column(String, default="")
    items: Mapped[list["Item"]] = relationship(cascade="all, delete-orphan", lazy="selectin", order_by="Item.id")
class Item(Base):
    __tablename__ = "purchase_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    purchase_id: Mapped[int] = mapped_column(ForeignKey("purchases.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[Optional[int]] = mapped_column(ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    product_name: Mapped[str] = mapped_column(String(160)); category_name: Mapped[str] = mapped_column(String(60), default="")
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2)); unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2))

def db():
    with SessionLocal() as s: yield s

class ProductIn(BaseModel):
    name: str = Field(min_length=1, max_length=120); brand: str = ""; category_id: Optional[int] = None
    unit: str = "piece"; price: Decimal = Field(ge=0); active: bool = True
class ItemIn(BaseModel):
    product_id: int; quantity: Decimal = Field(gt=0); unit_price: Optional[Decimal] = Field(default=None, ge=0)
class PurchaseIn(BaseModel):
    date: dt.date; note: str = ""; items: list[ItemIn] = Field(min_length=1)
class CategoryIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)

def pj(p: Product): return dict(id=p.id, name=p.name, brand=p.brand, category_id=p.category_id,
    category=p.category.name if p.category else "", unit=p.unit, price=float(p.price), active=p.active)
def uj(p: Purchase): return dict(id=p.id, date=p.date.isoformat(), note=p.note, total=float(sum(i.subtotal for i in p.items)),
    items=[dict(id=i.id, product_id=i.product_id, name=i.product_name, category=i.category_name,
                quantity=float(i.quantity), unit_price=float(i.unit_price), subtotal=float(i.subtotal)) for i in p.items])

app = FastAPI(title="Daily Khata")
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
                   allow_methods=["*"], allow_headers=["*"])
r = APIRouter(prefix="/api")

@app.on_event("startup")
def startup():
    Base.metadata.create_all(engine)
    with SessionLocal() as s:
        if s.scalar(select(Category.id).limit(1)) is None:
            cats = {n: Category(name=n) for n in ["Milk", "Dairy", "Bakery", "Grocery"]}
            s.add_all(cats.values()); s.flush()
            s.add_all([Product(name="Amul Gold Milk 500 ml", brand="Amul", category_id=cats["Milk"].id, unit="pouch", price=Decimal(37)),
                Product(name="Amul Masti Dahi ₹25", brand="Amul", category_id=cats["Dairy"].id, unit="pack", price=Decimal(25)),
                Product(name="Amul Masti Dahi ₹10", brand="Amul", category_id=cats["Dairy"].id, unit="pack", price=Decimal(10)),
                Product(name="Toast", brand="", category_id=cats["Bakery"].id, unit="packet", price=Decimal(30))])
            s.commit()

@r.get("/categories")
def cats(s: Session = Depends(db)): return [dict(id=c.id, name=c.name) for c in s.scalars(select(Category).order_by(Category.name))]
@r.post("/categories")
def add_cat(b: CategoryIn, s: Session = Depends(db)):
    if s.scalar(select(Category).where(Category.name == b.name)): raise HTTPException(409, "Category already exists")
    c = Category(name=b.name); s.add(c); s.commit(); return dict(id=c.id, name=c.name)
@r.delete("/categories/{cid}")
def del_cat(cid: int, s: Session = Depends(db)):
    c = s.get(Category, cid)
    if not c: raise HTTPException(404, "Not found")
    s.delete(c); s.commit(); return {"ok": True}

@r.get("/products")
def products(s: Session = Depends(db)): return [pj(p) for p in s.scalars(select(Product).order_by(Product.name))]
@r.post("/products")
def add_product(b: ProductIn, s: Session = Depends(db)):
    p = Product(**b.model_dump()); s.add(p); s.commit(); s.refresh(p); return pj(p)
@r.put("/products/{pid}")
def edit_product(pid: int, b: ProductIn, s: Session = Depends(db)):
    p = s.get(Product, pid)
    if not p: raise HTTPException(404, "Not found")
    for k, v in b.model_dump().items(): setattr(p, k, v)
    s.commit(); s.refresh(p); return pj(p)
@r.delete("/products/{pid}")
def del_product(pid: int, s: Session = Depends(db)):
    p = s.get(Product, pid)
    if not p: raise HTTPException(404, "Not found")
    s.delete(p); s.commit(); return {"ok": True}  # history keeps name + price snapshots

def fill(p: Purchase, b: PurchaseIn, s: Session):
    p.date, p.note = b.date, b.note; p.items.clear()
    for it in b.items:
        pr = s.get(Product, it.product_id)
        if not pr: raise HTTPException(400, f"Unknown product {it.product_id}")
        price = it.unit_price if it.unit_price is not None else pr.price
        p.items.append(Item(product_id=pr.id, product_name=pr.name, category_name=pr.category.name if pr.category else "",
                            quantity=it.quantity, unit_price=price, subtotal=(it.quantity * price).quantize(Decimal("0.01"))))

@r.post("/purchases")
def add_purchase(b: PurchaseIn, s: Session = Depends(db)):
    p = Purchase(); fill(p, b, s); s.add(p); s.commit(); return uj(p)
@r.put("/purchases/{pid}")
def edit_purchase(pid: int, b: PurchaseIn, s: Session = Depends(db)):
    p = s.get(Purchase, pid)
    if not p: raise HTTPException(404, "Not found")
    fill(p, b, s); s.commit(); return uj(p)
@r.delete("/purchases/{pid}")
def del_purchase(pid: int, s: Session = Depends(db)):
    p = s.get(Purchase, pid)
    if not p: raise HTTPException(404, "Not found")
    s.delete(p); s.commit(); return {"ok": True}
@r.get("/purchases")
def purchases(start: Optional[dt.date] = None, end: Optional[dt.date] = None, product: Optional[str] = None,
              category: Optional[str] = None, s: Session = Depends(db)):
    q = select(Purchase).order_by(Purchase.date.desc(), Purchase.id.desc())
    if start: q = q.where(Purchase.date >= start)
    if end: q = q.where(Purchase.date <= end)
    out = [uj(p) for p in s.scalars(q)]
    if product: out = [p for p in out if any(product.lower() in i["name"].lower() for i in p["items"])]
    if category: out = [p for p in out if any(i["category"] == category for i in p["items"])]
    return out

def summarize(s: Session, start: Optional[dt.date], end: Optional[dt.date]):
    q = select(Purchase)
    if start: q = q.where(Purchase.date >= start)  # inclusive both ends
    if end: q = q.where(Purchase.date <= end)
    ps = list(s.scalars(q))
    by_day, by_prod, by_cat, milk = {}, {}, {}, 0.0
    for p in ps:
        for i in p.items:
            sub, qty = float(i.subtotal), float(i.quantity); k = p.date.isoformat(); c = i.category_name or "Uncategorised"
            by_day[k] = by_day.get(k, 0) + sub
            d = by_prod.setdefault(i.product_name, dict(name=i.product_name, quantity=0, total=0)); d["quantity"] += qty; d["total"] += sub
            by_cat[c] = by_cat.get(c, 0) + sub
            if i.category_name == "Milk": milk += qty
    total = sum(by_day.values())
    lo = start or min((p.date for p in ps), default=dt.date.today()); hi = end or max((p.date for p in ps), default=dt.date.today())
    days = max((hi - lo).days + 1, 1)
    top = max(by_day.items(), key=lambda x: x[1], default=None)
    return dict(total=round(total, 2), entries=len(ps), milk_quantity=milk, days=days, average_daily=round(total / days, 2),
        highest_day=dict(date=top[0], total=round(top[1], 2)) if top else None,
        products=sorted(by_prod.values(), key=lambda x: -x["total"]),
        categories=[dict(name=k, total=round(v, 2)) for k, v in sorted(by_cat.items(), key=lambda x: -x[1])],
        daily=[dict(date=k, total=round(v, 2)) for k, v in sorted(by_day.items())])

@r.get("/summary")
def summary(start: Optional[dt.date] = None, end: Optional[dt.date] = None, s: Session = Depends(db)):
    if start and end and start > end: raise HTTPException(400, "Start date is after end date")
    return summarize(s, start, end)

@r.get("/dashboard")
def dashboard(today: Optional[dt.date] = None, s: Session = Depends(db)):
    t = today or dt.date.today(); m = summarize(s, t.replace(day=1), t)
    wd = {d["date"]: d["total"] for d in summarize(s, t - dt.timedelta(days=6), t)["daily"]}
    ds = [(t - dt.timedelta(days=i)).isoformat() for i in range(6, -1, -1)]
    recent = [uj(p) for p in s.scalars(select(Purchase).order_by(Purchase.date.desc(), Purchase.id.desc()).limit(5))]
    return dict(today_total=summarize(s, t, t)["total"], month=m, last7=[dict(date=d, total=wd.get(d, 0)) for d in ds], recent=recent)

app.include_router(r)
