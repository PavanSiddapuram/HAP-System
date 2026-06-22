"""
Database operations for the Healthcare Worker Service.

Provides a simple connection-pool wrapper around psycopg2 and
helper functions for updating appointment status and saving
notification records.
"""

import logging
import time
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Optional

import psycopg2
from psycopg2 import pool, OperationalError

from config import Config

logger = logging.getLogger(__name__)

# ── Connection Pool ───────────────────────────────────────────────────────────


class ConnectionPool:
    """Thin wrapper around psycopg2's ThreadedConnectionPool with retry logic."""

    _pool: Optional[pool.ThreadedConnectionPool] = None

    MAX_RETRIES: int = 30
    RETRY_DELAY_SECONDS: int = 5

    @classmethod
    def initialise(cls) -> None:
        """Create the connection pool, retrying until the database is reachable.

        This is especially important in Docker Compose environments where the
        database container may not be ready when the worker starts.
        """
        for attempt in range(1, cls.MAX_RETRIES + 1):
            try:
                cls._pool = pool.ThreadedConnectionPool(
                    minconn=1,
                    maxconn=5,
                    host=Config.DB_HOST,
                    port=Config.DB_PORT,
                    dbname=Config.DB_NAME,
                    user=Config.DB_USERNAME,
                    password=Config.DB_PASSWORD,
                )
                logger.info("✅ Database connection pool created successfully")
                return
            except OperationalError as exc:
                logger.warning(
                    "⏳ Database not ready (attempt %d/%d): %s",
                    attempt,
                    cls.MAX_RETRIES,
                    exc,
                )
                time.sleep(cls.RETRY_DELAY_SECONDS)

        raise RuntimeError(
            f"Could not connect to PostgreSQL after {cls.MAX_RETRIES} attempts"
        )

    @classmethod
    @contextmanager
    def get_connection(cls):
        """Yield a connection from the pool, returning it on exit."""
        if cls._pool is None:
            cls.initialise()

        conn = cls._pool.getconn()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            cls._pool.putconn(conn)

    @classmethod
    def close_all(cls) -> None:
        """Shut down the pool and release all connections."""
        if cls._pool is not None:
            cls._pool.closeall()
            logger.info("Database connection pool closed")


# ── Data-access helpers ───────────────────────────────────────────────────────


def update_appointment_status(appointment_id: int, new_status: str) -> None:
    """Transition an appointment to *new_status* and log the change.

    Steps
    -----
    1. Read the current status from the ``appointments`` table.
    2. Update the ``status`` and ``updated_at`` columns.
    3. Insert an audit row into ``appointment_logs``.
    """
    now = datetime.now(timezone.utc)

    with ConnectionPool.get_connection() as conn:
        with conn.cursor() as cur:
            # 1 – Fetch current status
            cur.execute(
                "SELECT status FROM appointments WHERE id = %s",
                (appointment_id,),
            )
            row = cur.fetchone()
            if row is None:
                logger.error(
                    "Appointment #%s not found in database", appointment_id
                )
                return
            previous_status = row[0]

            # 2 – Update appointment
            cur.execute(
                """
                UPDATE appointments
                   SET status     = %s,
                       updated_at = %s
                 WHERE id = %s
                """,
                (new_status, now, appointment_id),
            )

            # 3 – Insert audit log
            message = (
                f"Status changed from {previous_status} to {new_status}"
            )
            cur.execute(
                """
                INSERT INTO appointment_logs
                       (appointment_id, previous_status, new_status, message, timestamp)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (appointment_id, previous_status, new_status, message, now),
            )

    logger.info(
        "📝 Appointment #%s status updated: %s → %s",
        appointment_id,
        previous_status,
        new_status,
    )


def save_notification(
    appointment_id: int,
    notification_type: str,
    recipient: str,
    message: str,
    status: str = "SENT",
) -> None:
    """Persist a notification record in the ``notifications`` table."""
    now = datetime.now(timezone.utc)

    with ConnectionPool.get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO notifications
                       (appointment_id, type, recipient, message, status, sent_at)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (appointment_id, notification_type, recipient, message, status, now),
            )

    logger.info(
        "💾 Notification saved  [type=%s, recipient=%s]",
        notification_type,
        recipient,
    )
