from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db
from app.schemas import CreateReviewRequest
from app.utils.security import get_current_user
from app.utils.helpers import fmt_review

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/{turf_id}")
def get_reviews(turf_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT r.*, u.name AS user_name
                   FROM reviews r
                   LEFT JOIN users u ON r.user_id=u.id
                   WHERE r.turf_id=%s
                   ORDER BY r.created_at DESC LIMIT 50""",
                (turf_id,),
            )
            rows = cur.fetchall()
    return [fmt_review(dict(r)) for r in rows]


@router.post("")
def create_review(body: CreateReviewRequest, user=Depends(get_current_user)):
    with get_db() as conn:
        with conn.cursor() as cur:
            # Upsert review
            cur.execute(
                "SELECT id FROM reviews WHERE turf_id=%s AND user_id=%s",
                (body.turf_id, user["id"]),
            )
            existing = cur.fetchone()

            if existing:
                cur.execute(
                    "UPDATE reviews SET rating=%s,comment=%s WHERE id=%s RETURNING *",
                    (body.rating, body.comment or "", existing["id"]),
                )
            else:
                cur.execute(
                    "INSERT INTO reviews (turf_id,user_id,rating,comment) VALUES (%s,%s,%s,%s) RETURNING *",
                    (body.turf_id, user["id"], body.rating, body.comment or ""),
                )
            review = dict(cur.fetchone())

            # Update turf aggregate rating
            cur.execute(
                """UPDATE turfs t SET
                   rating = rv.avg_rating,
                   review_count = rv.cnt,
                   updated_at = NOW()
                   FROM (
                       SELECT COALESCE(ROUND(AVG(rating)::numeric,1), 4.5) AS avg_rating,
                              COUNT(*)::int AS cnt
                       FROM reviews WHERE turf_id = %s
                   ) rv
                   WHERE t.id = %s""",
                (body.turf_id, body.turf_id),
            )

            # Fetch with user name for response
            cur.execute(
                "SELECT r.*, u.name AS user_name FROM reviews r LEFT JOIN users u ON r.user_id=u.id WHERE r.id=%s",
                (review["id"],),
            )
            full = cur.fetchone()
    return fmt_review(dict(full))


@router.delete("/{review_id}")
def delete_review(review_id: str, user=Depends(get_current_user)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM reviews WHERE id=%s", (review_id,))
            r = cur.fetchone()
            if not r:
                raise HTTPException(404, "Review not found.")
            if str(r["user_id"]) != str(user["id"]) and user["role"] != "admin":
                raise HTTPException(403, "Not authorized.")
            turf_id = r["turf_id"]
            cur.execute("DELETE FROM reviews WHERE id=%s", (review_id,))
            cur.execute(
                """UPDATE turfs t SET
                   rating = rv.avg_rating,
                   review_count = rv.cnt,
                   updated_at = NOW()
                   FROM (
                       SELECT COALESCE(ROUND(AVG(rating)::numeric,1), 4.5) AS avg_rating,
                              COUNT(*)::int AS cnt
                       FROM reviews WHERE turf_id = %s
                   ) rv
                   WHERE t.id = %s""",
                (turf_id, turf_id),
            )
    return {"msg": "Review deleted."}
