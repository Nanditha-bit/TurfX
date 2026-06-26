import io
import csv
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.database import get_db
from app.utils.security import require_roles

router = APIRouter(prefix="/exports", tags=["exports"])
OWNER_OR_ADMIN = require_roles("owner", "admin")


def _stream_csv(rows: list[list], filename: str) -> StreamingResponse:
    buf = io.StringIO()
    writer = csv.writer(buf)
    for row in rows:
        writer.writerow(row)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/bookings/csv")
def export_bookings(user=Depends(OWNER_OR_ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT b.*, t.name AS turf_name, t.sport AS turf_sport,
                    u.name AS user_name, u.phone AS user_phone
                   FROM bookings b
                   JOIN turfs t ON b.turf_id=t.id
                   JOIN users u ON b.user_id=u.id
                   WHERE t.owner_id=%s ORDER BY b.created_at DESC""",
                (user["id"],),
            )
            rows = cur.fetchall()

    header = ["Booking ID", "Customer", "Phone", "Venue", "Sport",
              "Date", "Time Slots", "Total Price", "Status", "Created At"]
    data = [header] + [
        [
            r["booking_id"] or str(r["id"])[-8:].upper(),
            r["user_name"], r["user_phone"], r["turf_name"], r["turf_sport"],
            str(r["date"]),
            " | ".join(r["time_slots"] or []),
            r["total_price"], r["status"],
            r["created_at"].strftime("%d/%m/%Y") if r.get("created_at") else "",
        ]
        for r in rows
    ]
    return _stream_csv(data, "bookings.csv")


@router.get("/earnings/csv")
def export_earnings(user=Depends(OWNER_OR_ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT b.date, t.name AS turf_name,
                    b.time_slots, b.total_price
                   FROM bookings b JOIN turfs t ON b.turf_id=t.id
                   WHERE t.owner_id=%s AND b.status!='cancelled'
                   ORDER BY b.date DESC""",
                (user["id"],),
            )
            rows = cur.fetchall()

    header = ["Date", "Venue", "Time Slots", "Total Amount", "Platform Fee (5%)", "Net Earnings"]
    data = [header] + [
        [
            str(r["date"]), r["turf_name"],
            " | ".join(r["time_slots"] or []),
            float(r["total_price"]),
            round(float(r["total_price"]) * 0.05),
            round(float(r["total_price"]) * 0.95),
        ]
        for r in rows
    ]
    return _stream_csv(data, "earnings.csv")


@router.get("/payouts/csv")
def export_payouts(user=Depends(OWNER_OR_ADMIN)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT b.date,
                    SUM(b.total_price * 0.95) AS net_amount,
                    COUNT(*) AS booking_count
                   FROM bookings b JOIN turfs t ON b.turf_id=t.id
                   WHERE t.owner_id=%s AND b.status!='cancelled'
                   GROUP BY b.date ORDER BY b.date DESC""",
                (user["id"],),
            )
            rows = cur.fetchall()

    from datetime import date
    today = date.today()
    header = ["Date", "Bookings", "Net Amount", "Status"]
    data = [header] + [
        [
            str(r["date"]), r["booking_count"],
            round(float(r["net_amount"])),
            "Settled" if r["date"] <= today else "Pending",
        ]
        for r in rows
    ]
    return _stream_csv(data, "payouts.csv")
