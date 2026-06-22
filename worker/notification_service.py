"""
Notification simulation service for the Healthcare Worker.

In a production system this module would integrate with an email / SMS
gateway.  Here it logs the notification details and persists a record
in the database.
"""

import logging
from datetime import datetime, timezone

from database import save_notification

logger = logging.getLogger(__name__)


def send_appointment_confirmation(event_data: dict) -> bool:
    """Send (simulate) an appointment-confirmation notification.

    Parameters
    ----------
    event_data : dict
        The decoded JSON payload from the ``appointment.created`` event.
        Expected keys: ``appointmentId``, ``userEmail``, ``userName``,
        ``doctorName``, ``appointmentDate``, ``timeSlot``.

    Returns
    -------
    bool
        ``True`` when the notification was saved successfully.
    """
    appointment_id = event_data.get("appointmentId")
    user_email = event_data.get("userEmail", "unknown")
    user_name = event_data.get("userName", "Patient")
    doctor_name = event_data.get("doctorName", "Doctor")
    appointment_date = event_data.get("slotDate", "N/A")
    start_time = event_data.get("startTime", "N/A")
    end_time = event_data.get("endTime", "N/A")
    time_slot = f"{start_time} - {end_time}"

    logger.info("📧 Sending appointment confirmation to %s", user_email)
    logger.info(
        "   ├─ Doctor : %s\n"
        "   ├─ Date   : %s\n"
        "   └─ Time   : %s",
        doctor_name,
        appointment_date,
        time_slot,
    )

    message = (
        f"Dear {user_name}, your appointment with Dr. {doctor_name} "
        f"on {appointment_date} at {time_slot} has been confirmed. "
        f"Thank you for choosing our healthcare platform!"
    )

    try:
        save_notification(
            appointment_id=appointment_id,
            notification_type="APPOINTMENT_CONFIRMATION",
            recipient=user_email,
            message=message,
            status="SENT",
        )
        logger.info("✅ Confirmation notification sent successfully")
        return True
    except Exception:
        logger.exception(
            "❌ Failed to save confirmation notification for appointment #%s",
            appointment_id,
        )
        return False


def send_cancellation_notification(event_data: dict) -> bool:
    """Send (simulate) an appointment-cancellation notification.

    Parameters
    ----------
    event_data : dict
        The decoded JSON payload from the ``appointment.cancelled`` event.
        Expected keys: ``appointmentId``, ``userEmail``, ``userName``,
        ``doctorName``, ``appointmentDate``, ``timeSlot``, ``reason``.

    Returns
    -------
    bool
        ``True`` when the notification was saved successfully.
    """
    appointment_id = event_data.get("appointmentId")
    user_email = event_data.get("userEmail", "unknown")
    user_name = event_data.get("userName", "Patient")
    doctor_name = event_data.get("doctorName", "Doctor")
    appointment_date = event_data.get("slotDate", "N/A")
    start_time = event_data.get("startTime", "N/A")
    end_time = event_data.get("endTime", "N/A")
    time_slot = f"{start_time} - {end_time}"
    reason = event_data.get("reason", "No reason provided")

    logger.info("📧 Sending cancellation notification to %s", user_email)
    logger.info(
        "   ├─ Doctor : %s\n"
        "   ├─ Date   : %s\n"
        "   ├─ Time   : %s\n"
        "   └─ Reason : %s",
        doctor_name,
        appointment_date,
        time_slot,
        reason,
    )

    message = (
        f"Dear {user_name}, your appointment with Dr. {doctor_name} "
        f"on {appointment_date} at {time_slot} has been cancelled. "
        f"Reason: {reason}. "
        f"Please contact us if you wish to reschedule."
    )

    try:
        save_notification(
            appointment_id=appointment_id,
            notification_type="APPOINTMENT_CANCELLATION",
            recipient=user_email,
            message=message,
            status="SENT",
        )
        logger.info("✅ Cancellation notification sent successfully")
        return True
    except Exception:
        logger.exception(
            "❌ Failed to save cancellation notification for appointment #%s",
            appointment_id,
        )
        return False
