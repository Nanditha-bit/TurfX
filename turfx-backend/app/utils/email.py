import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.config import settings

logger = logging.getLogger(__name__)


def _send_mail(to: str, subject: str, html: str) -> bool:
    """Send an HTML email. Returns True on success, False on failure."""
    if not settings.SMTP_USER or not settings.SMTP_PASS:
        logger.warning("SMTP not configured — skipping email send.")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM
        msg["To"] = to
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(settings.SMTP_USER, to, msg.as_string())
        return True
    except Exception as exc:
        logger.error(f"Email send error: {exc}")
        return False


def send_otp_email(to: str, otp: str, otp_type: str = "login") -> bool:
    subjects = {
        "login": "Your TurfX Login OTP",
        "forgot_password": "Reset Your TurfX Password",
        "register": "Verify Your TurfX Account",
    }
    messages = {
        "login": "Your TurfX login OTP is:",
        "forgot_password": "Your password reset OTP is:",
        "register": "Your verification OTP is:",
    }
    subject = subjects.get(otp_type, "Your TurfX OTP")
    message = messages.get(otp_type, "Your OTP is:")

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
      <div style="background:#084734;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
        <h1 style="color:#CEF17B;margin:0;font-size:24px;">TurfX</h1>
      </div>
      <div style="background:#f8f9fa;padding:30px;border-radius:0 0 8px 8px;">
        <h2 style="color:#161616;margin-top:0;">Verification Code</h2>
        <p style="color:#666;font-size:16px;">{message}</p>
        <div style="background:#084734;color:#CEF17B;font-size:32px;font-weight:bold;
                    text-align:center;padding:20px;border-radius:8px;letter-spacing:8px;margin:20px 0;">
          {otp}
        </div>
        <p style="color:#999;font-size:13px;">Valid for 10 minutes.
           If you didn't request this, please ignore this email.</p>
      </div>
    </div>
    """
    return _send_mail(to, subject, html)


def send_booking_confirmation(to: str, turf_name: str, date: str,
                               slots: str, amount: float) -> bool:
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;">
      <div style="background:#084734;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
        <h1 style="color:#CEF17B;margin:0;">TurfX</h1>
        <p style="color:rgba(255,255,255,0.8);margin:5px 0;">Booking Confirmed ✓</p>
      </div>
      <div style="background:#f8f9fa;padding:30px;border-radius:0 0 8px 8px;">
        <h2 style="color:#161616;">Your booking is confirmed!</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#666;">Venue</td>
              <td style="padding:8px 0;font-weight:bold;">{turf_name}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Date</td>
              <td style="padding:8px 0;font-weight:bold;">{date}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Time Slots</td>
              <td style="padding:8px 0;font-weight:bold;">{slots}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Total Paid</td>
              <td style="padding:8px 0;font-weight:bold;color:#084734;">₹{amount:,.0f}</td></tr>
        </table>
      </div>
    </div>
    """
    return _send_mail(to, "Booking Confirmed - TurfX", html)
