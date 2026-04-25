import stripe
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import User
from .projects import get_current_user

router = APIRouter(prefix="/api/billing", tags=["billing"])


def _stripe():
    stripe.api_key = settings.stripe_secret_key
    return stripe


@router.get("/status")
def billing_status(user: Annotated[User, Depends(get_current_user)]):
    return {
        "subscription_status": user.subscription_status,
        "trial_days_remaining": user.trial_days_remaining(),
        "is_active": user.is_active_subscriber(),
    }


@router.post("/checkout")
def create_checkout(
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    if not settings.stripe_secret_key:
        raise HTTPException(status_code=503, detail="Payments not configured yet")

    s = _stripe()

    # Create Stripe customer if needed
    if not user.stripe_customer_id:
        customer = s.Customer.create(
            email=user.email or f"{user.github_username}@github",
            metadata={"github_username": user.github_username, "user_id": str(user.id)},
        )
        user.stripe_customer_id = customer.id
        db.commit()

    session = s.checkout.Session.create(
        customer=user.stripe_customer_id,
        mode="subscription",
        line_items=[{"price": settings.stripe_price_id, "quantity": 1}],
        success_url=f"{settings.frontend_url}/billing?success=true",
        cancel_url=f"{settings.frontend_url}/billing?cancelled=true",
        subscription_data={"trial_period_days": 14} if user.subscription_status == "trial" else {},
    )
    return {"url": session.url}


@router.post("/portal")
def create_portal(
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    if not settings.stripe_secret_key or not user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No active subscription")

    s = _stripe()
    session = s.billing_portal.Session.create(
        customer=user.stripe_customer_id,
        return_url=f"{settings.frontend_url}/billing",
    )
    return {"url": session.url}


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
):
    if not settings.stripe_webhook_secret:
        raise HTTPException(status_code=503, detail="Webhook not configured")

    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.stripe_webhook_secret
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    data = event["data"]["object"]

    if event["type"] in ("customer.subscription.created", "customer.subscription.updated"):
        _update_subscription(db, data)
    elif event["type"] == "customer.subscription.deleted":
        _cancel_subscription(db, data)
    elif event["type"] == "invoice.payment_failed":
        _mark_past_due(db, data.get("customer"))

    return {"received": True}


def _update_subscription(db: Session, sub: dict):
    user = db.query(User).filter(User.stripe_customer_id == sub["customer"]).first()
    if not user:
        return
    status = sub.get("status")
    if status in ("active", "trialing"):
        user.subscription_status = "active"
    elif status in ("canceled", "unpaid"):
        user.subscription_status = "cancelled"
    db.commit()


def _cancel_subscription(db: Session, sub: dict):
    user = db.query(User).filter(User.stripe_customer_id == sub["customer"]).first()
    if user:
        user.subscription_status = "cancelled"
        db.commit()


def _mark_past_due(db: Session, customer_id: str | None):
    if not customer_id:
        return
    user = db.query(User).filter(User.stripe_customer_id == customer_id).first()
    if user:
        user.subscription_status = "past_due"
        db.commit()
