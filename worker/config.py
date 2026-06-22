"""
Configuration module for the Healthcare Worker Service.

Loads settings from environment variables with sensible defaults
for local development and Docker Compose deployments.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Central configuration loaded from environment variables."""

    # ── RabbitMQ ──────────────────────────────────────────────────────────
    RABBITMQ_HOST: str = os.getenv("RABBITMQ_HOST", "localhost")
    RABBITMQ_PORT: int = int(os.getenv("RABBITMQ_PORT", "5672"))
    RABBITMQ_USERNAME: str = os.getenv("RABBITMQ_USERNAME", "guest")
    RABBITMQ_PASSWORD: str = os.getenv("RABBITMQ_PASSWORD", "guest")

    # ── PostgreSQL ────────────────────────────────────────────────────────
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "5432"))
    DB_NAME: str = os.getenv("DB_NAME", "healthcare_db")
    DB_USERNAME: str = os.getenv("DB_USERNAME", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "postgres")

    # ── Exchange & Queue names ────────────────────────────────────────────
    EXCHANGE_NAME: str = "healthcare.exchange"
    CREATED_QUEUE: str = "appointment.created.queue"
    CANCELLED_QUEUE: str = "appointment.cancelled.queue"
    CREATED_ROUTING_KEY: str = "appointment.created"
    CANCELLED_ROUTING_KEY: str = "appointment.cancelled"

    @classmethod
    def rabbitmq_url(cls) -> str:
        """Return an AMQP connection URL built from individual settings."""
        return (
            f"amqp://{cls.RABBITMQ_USERNAME}:{cls.RABBITMQ_PASSWORD}"
            f"@{cls.RABBITMQ_HOST}:{cls.RABBITMQ_PORT}/"
        )

    @classmethod
    def summary(cls) -> str:
        """Return a human-readable summary of the active configuration."""
        return (
            f"  RabbitMQ : {cls.RABBITMQ_HOST}:{cls.RABBITMQ_PORT}\n"
            f"  Database : {cls.DB_HOST}:{cls.DB_PORT}/{cls.DB_NAME}\n"
            f"  Exchange : {cls.EXCHANGE_NAME}\n"
            f"  Queues   : {cls.CREATED_QUEUE}, {cls.CANCELLED_QUEUE}"
        )
