"""Pydantic request/response schemas."""
from typing import Any, List, Optional
from pydantic import BaseModel, EmailStr, Field


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    password: str = Field(min_length=6)
    role: str = "user"


class LoginRequest(BaseModel):
    phone: str
    password: str


class SendOTPRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None


class VerifyOTPRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    otp: str


class ForgotPasswordRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None


class ResetPasswordRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    otp: str
    newPassword: str = Field(min_length=6)


class UpdateProfileRequest(BaseModel):
    name: str


# ── Turfs ─────────────────────────────────────────────────────────────────────

class CreateTurfRequest(BaseModel):
    name: str
    location: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    pincode: Optional[str] = ""
    price_per_hour: float
    sport: Optional[str] = "Football"
    sports: Optional[List[str]] = []
    type: Optional[str] = "Outdoor"
    venueSize: Optional[str] = ""
    surfaceType: Optional[str] = ""
    bookingType: Optional[str] = "Hourly"
    description: Optional[str] = ""
    shortDescription: Optional[str] = ""
    amenities: Optional[List[str]] = []
    images: Optional[List[str]] = []
    videos: Optional[List[str]] = []
    lat: Optional[float] = None
    lng: Optional[float] = None


class UpdateTurfRequest(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    price_per_hour: Optional[float] = None
    sport: Optional[str] = None
    sports: Optional[List[str]] = None
    type: Optional[str] = None
    venueSize: Optional[str] = None
    surfaceType: Optional[str] = None
    bookingType: Optional[str] = None
    description: Optional[str] = None
    shortDescription: Optional[str] = None
    amenities: Optional[List[Any]] = None
    images: Optional[List[str]] = None
    videos: Optional[List[str]] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    pricingRules: Optional[List[Any]] = None


# ── Bookings ──────────────────────────────────────────────────────────────────

class CreateOrderRequest(BaseModel):
    amount: float


class DirectBookingRequest(BaseModel):
    turf_id: str
    date: str
    time_slots: List[str]
    total_price: float
    sport: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    payment_id: Optional[str] = None


class CancelBookingRequest(BaseModel):
    reason: Optional[str] = None


class RescheduleRequest(BaseModel):
    newDate: str
    newTimeSlot: Any  # str or list


class RejectBookingRequest(BaseModel):
    reason: Optional[str] = None


# ── Reviews ───────────────────────────────────────────────────────────────────

class CreateReviewRequest(BaseModel):
    turf_id: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = ""


# ── Slots ─────────────────────────────────────────────────────────────────────

class CreateSlotRequest(BaseModel):
    turf_id: str
    date: str
    time_slot: str


class UpdateSlotRequest(BaseModel):
    date: Optional[str] = None
    time_slot: Optional[str] = None


# ── Offers ────────────────────────────────────────────────────────────────────

class CreateOfferRequest(BaseModel):
    turf_id: str
    title: str
    discount: Optional[str] = ""
    description: Optional[str] = ""
    valid_until: Optional[str] = None


class UpdateOfferRequest(BaseModel):
    turf_id: Optional[str] = None
    title: Optional[str] = None
    discount: Optional[str] = None
    description: Optional[str] = None
    valid_until: Optional[str] = None


# ── Support ───────────────────────────────────────────────────────────────────

class CreateTicketRequest(BaseModel):
    subject: str
    description: Optional[str] = ""
    category: Optional[str] = "Other"
    priority: Optional[str] = "Medium"


class UpdateTicketRequest(BaseModel):
    status: Optional[str] = None
    admin_reply: Optional[str] = None


# ── KYC ──────────────────────────────────────────────────────────────────────

class KYCRequest(BaseModel):
    business_name: Optional[str] = None
    pan_number: Optional[str] = None
    gst_number: Optional[str] = None
    bank_account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    account_holder_name: Optional[str] = None
    bank_name: Optional[str] = None


class KYCReviewRequest(BaseModel):
    status: str
    admin_note: Optional[str] = None


# ── Wallet ────────────────────────────────────────────────────────────────────

class WalletAddRequest(BaseModel):
    amount: float


class BankDetails(BaseModel):
    accountNumber: str
    ifscCode: str
    accountHolderName: str
    bankName: Optional[str] = ""


class WalletWithdrawRequest(BaseModel):
    amount: float
    bankAccount: BankDetails
