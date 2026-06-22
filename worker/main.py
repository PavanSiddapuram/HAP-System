"""
Entry point for the Healthcare Worker Service.

Initialises logging, prints a startup banner, connects to RabbitMQ and
PostgreSQL, then enters the event-consumption loop.
"""

import logging
import sys

from config import Config
from consumer import AppointmentEventConsumer
from database import ConnectionPool

# ── Logging setup ─────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger("worker")

# ── ASCII banner ──────────────────────────────────────────────────────────────

BANNER = r"""
╔══════════════════════════════════════════════════════════╗
║        _   _            _ _   _                         ║
║       | | | | ___  __ _| | |_| |__   ___ __ _ _ __ ___ ║
║       | |_| |/ _ \/ _` | | __| '_ \ / __/ _` | '__/ _ \║
║       |  _  |  __/ (_| | | |_| | | | (_| (_| | | |  __/║
║       |_| |_|\___|\__,_|_|\__|_| |_|\___\__,_|_|  \___║
║                                                          ║
║              W O R K E R   S E R V I C E                 ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
"""


def main() -> None:
    """Bootstrap and run the worker service."""
    print(BANNER)

    logger.info("Configuration:")
    for line in Config.summary().splitlines():
        logger.info(line)

    # 1 – Database
    logger.info("Initialising database connection pool …")
    ConnectionPool.initialise()

    # 2 – RabbitMQ consumer
    consumer = AppointmentEventConsumer()

    logger.info("Connecting to RabbitMQ …")
    consumer.connect()

    logger.info("Setting up exchanges and queues …")
    consumer.setup_queues()

    logger.info("🚀 Worker service started. Waiting for events…")

    try:
        consumer.start_consuming()
    except KeyboardInterrupt:
        logger.info("⛔ Shutdown requested (KeyboardInterrupt)")
        consumer.stop()
    except Exception:
        logger.exception("💥 Unexpected error — shutting down")
        consumer.stop()
        sys.exit(1)
    finally:
        ConnectionPool.close_all()
        logger.info("👋 Worker service stopped")


if __name__ == "__main__":
    main()
