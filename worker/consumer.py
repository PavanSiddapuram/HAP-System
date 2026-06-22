"""
RabbitMQ consumer for healthcare appointment events.

Listens on two queues:
  • ``appointment.created.queue``  – confirms the appointment and sends a
    confirmation notification.
  • ``appointment.cancelled.queue`` – sends a cancellation notification.

Messages are manually acknowledged after successful processing; on failure
they are negatively acknowledged **without** requeue to prevent infinite
retry loops.
"""

import json
import logging
import time

import pika
from pika.exceptions import AMQPConnectionError

from config import Config
from database import ConnectionPool, update_appointment_status
from notification_service import (
    send_appointment_confirmation,
    send_cancellation_notification,
)

logger = logging.getLogger(__name__)


class AppointmentEventConsumer:
    """Consumes appointment lifecycle events from RabbitMQ."""

    MAX_CONNECT_RETRIES: int = 30
    RETRY_DELAY_SECONDS: int = 5

    def __init__(self) -> None:
        self._connection: pika.BlockingConnection | None = None
        self._channel: pika.adapters.blocking_connection.BlockingChannel | None = None

    # ── Connection ────────────────────────────────────────────────────────

    def connect(self) -> None:
        """Establish a connection to RabbitMQ with retry logic.

        RabbitMQ may not be ready when the worker starts in a Docker Compose
        environment, so we retry up to ``MAX_CONNECT_RETRIES`` times with a
        delay of ``RETRY_DELAY_SECONDS`` seconds between attempts.
        """
        credentials = pika.PlainCredentials(
            Config.RABBITMQ_USERNAME,
            Config.RABBITMQ_PASSWORD,
        )
        parameters = pika.ConnectionParameters(
            host=Config.RABBITMQ_HOST,
            port=Config.RABBITMQ_PORT,
            credentials=credentials,
            heartbeat=600,
            blocked_connection_timeout=300,
        )

        for attempt in range(1, self.MAX_CONNECT_RETRIES + 1):
            try:
                self._connection = pika.BlockingConnection(parameters)
                self._channel = self._connection.channel()
                self._channel.basic_qos(prefetch_count=1)
                logger.info("✅ Connected to RabbitMQ at %s:%s",
                            Config.RABBITMQ_HOST, Config.RABBITMQ_PORT)
                return
            except AMQPConnectionError as exc:
                logger.warning(
                    "⏳ RabbitMQ not ready (attempt %d/%d): %s",
                    attempt,
                    self.MAX_CONNECT_RETRIES,
                    exc,
                )
                time.sleep(self.RETRY_DELAY_SECONDS)

        raise RuntimeError(
            f"Could not connect to RabbitMQ after {self.MAX_CONNECT_RETRIES} attempts"
        )

    # ── Queue / Exchange setup ────────────────────────────────────────────

    def setup_queues(self) -> None:
        """Declare the exchange, queues and bindings."""
        # Exchange
        self._channel.exchange_declare(
            exchange=Config.EXCHANGE_NAME,
            exchange_type="topic",
            durable=True,
        )
        logger.info("📦 Exchange declared: %s (topic, durable)", Config.EXCHANGE_NAME)

        # Created queue
        self._channel.queue_declare(queue=Config.CREATED_QUEUE, durable=True)
        self._channel.queue_bind(
            exchange=Config.EXCHANGE_NAME,
            queue=Config.CREATED_QUEUE,
            routing_key=Config.CREATED_ROUTING_KEY,
        )
        logger.info(
            "📦 Queue declared & bound: %s ← %s",
            Config.CREATED_QUEUE,
            Config.CREATED_ROUTING_KEY,
        )

        # Cancelled queue
        self._channel.queue_declare(queue=Config.CANCELLED_QUEUE, durable=True)
        self._channel.queue_bind(
            exchange=Config.EXCHANGE_NAME,
            queue=Config.CANCELLED_QUEUE,
            routing_key=Config.CANCELLED_ROUTING_KEY,
        )
        logger.info(
            "📦 Queue declared & bound: %s ← %s",
            Config.CANCELLED_QUEUE,
            Config.CANCELLED_ROUTING_KEY,
        )

    # ── Callbacks ─────────────────────────────────────────────────────────

    def on_appointment_created(self, ch, method, properties, body) -> None:
        """Handle an ``appointment.created`` event."""
        try:
            event_data: dict = json.loads(body)
            appointment_id = event_data.get("appointmentId", "?")

            logger.info(
                "📥 Received appointment.created event for appointment #%s",
                appointment_id,
            )

            # Send confirmation notification
            send_appointment_confirmation(event_data)

            # Transition appointment to CONFIRMED
            update_appointment_status(appointment_id, "CONFIRMED")

            logger.info(
                "✅ Appointment #%s processed and confirmed", appointment_id
            )
            ch.basic_ack(delivery_tag=method.delivery_tag)

        except Exception:
            logger.exception(
                "❌ Error processing appointment.created event"
            )
            # Nack without requeue to avoid an infinite failure loop
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    def on_appointment_cancelled(self, ch, method, properties, body) -> None:
        """Handle an ``appointment.cancelled`` event."""
        try:
            event_data: dict = json.loads(body)
            appointment_id = event_data.get("appointmentId", "?")

            logger.info(
                "📥 Received appointment.cancelled event for appointment #%s",
                appointment_id,
            )

            # Send cancellation notification
            send_cancellation_notification(event_data)

            logger.info(
                "✅ Cancellation for appointment #%s processed", appointment_id
            )
            ch.basic_ack(delivery_tag=method.delivery_tag)

        except Exception:
            logger.exception(
                "❌ Error processing appointment.cancelled event"
            )
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    # ── Main loop ─────────────────────────────────────────────────────────

    def start_consuming(self) -> None:
        """Register callbacks on both queues and block until cancelled."""
        self._channel.basic_consume(
            queue=Config.CREATED_QUEUE,
            on_message_callback=self.on_appointment_created,
            auto_ack=False,
        )
        self._channel.basic_consume(
            queue=Config.CANCELLED_QUEUE,
            on_message_callback=self.on_appointment_cancelled,
            auto_ack=False,
        )

        logger.info("👂 Consuming from %s and %s",
                     Config.CREATED_QUEUE, Config.CANCELLED_QUEUE)
        self._channel.start_consuming()

    def stop(self) -> None:
        """Gracefully stop consuming and close the connection."""
        if self._channel and self._channel.is_open:
            self._channel.stop_consuming()
        if self._connection and self._connection.is_open:
            self._connection.close()
        logger.info("🔌 RabbitMQ connection closed")
