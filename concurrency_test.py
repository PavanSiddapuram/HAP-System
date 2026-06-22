"""
Concurrent slot booking test for the Healthcare Appointment Platform.

Strategy:
  1. Register 5 unique users.
  2. Pick a single available slot (Doctor 2, today).
  3. Fire 5 threads simultaneously, each attempting to book the same slot.
  4. Assert: exactly 1 response is 201 (Created) and 4 are 409 (Conflict).

Run against the live stack:  python concurrency_test.py
"""

import datetime
import json
import random
import sys
import threading
import urllib.error
import urllib.request

BACKEND_URL = "http://localhost:8080"
NUM_THREADS = 5
DOCTOR_ID = 2  # Dr. Michael Chen — Dermatology


# ── HTTP helpers ───────────────────────────────────────────────────────────


def http_post(url, data, token=None):
    req = urllib.request.Request(
        url, data=json.dumps(data).encode("utf-8"), method="POST"
    )
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8")), resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return json.loads(body), e.code
        except Exception:
            return {"error": body}, e.code


def http_get(url, token=None):
    req = urllib.request.Request(url, method="GET")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8")), resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return json.loads(body), e.code
        except Exception:
            return {"error": body}, e.code


# ── Setup ──────────────────────────────────────────────────────────────────


def register_user(index):
    tag = f"{index}_{random.randint(10000, 99999)}"
    email = f"concurrent_{tag}@test.com"
    res, status = http_post(f"{BACKEND_URL}/api/auth/register", {
        "fullName": f"Concurrent User {index}",
        "email": email,
        "password": "Password123!",
        "phone": "+1234567890",
    })
    assert status in (200, 201), f"Registration failed for user {index}: {status} {res}"
    print(f"  [setup] Registered user {index}: {email}")
    return res["token"]


def pick_slot(token):
    today = datetime.date.today().strftime("%Y-%m-%d")
    slots, status = http_get(
        f"{BACKEND_URL}/api/slots?date={today}&doctorId={DOCTOR_ID}", token
    )
    assert status == 200 and slots, (
        f"No available slots for doctorId={DOCTOR_ID} on {today}. "
        "Run functional_test.py first to ensure a fresh slot exists."
    )
    chosen = slots[0]
    print(
        f"  [setup] Target slot: ID={chosen['id']}  "
        f"{chosen['startTime']}–{chosen['endTime']}  "
        f"(Dr. {chosen['doctorName']})"
    )
    return chosen["id"]


# ── Concurrent booking ─────────────────────────────────────────────────────


def attempt_booking(user_index, token, slot_id, results, barrier):
    """Thread worker: waits at the barrier then fires the booking request.

    user_index is 0-based so it maps directly to results[user_index].
    The display label uses user_index+1 for human-readable output.
    """
    barrier.wait()  # all threads release simultaneously
    res, status = http_post(
        f"{BACKEND_URL}/api/appointments",
        {"slotId": slot_id, "notes": f"concurrent attempt by user {user_index + 1}"},
        token,
    )
    results[user_index] = status
    label = "BOOKED" if status == 201 else f"REJECTED ({status})"
    print(f"  [thread-{user_index + 1}] {label}")


# ── Main ───────────────────────────────────────────────────────────────────


def run_concurrency_test():
    print("\n" + "=" * 60)
    print("  HAP-System — Concurrent Booking Test")
    print("=" * 60)
    print(f"[*] Targeting backend at: {BACKEND_URL}")
    print(f"[*] Threads: {NUM_THREADS}  |  Target doctor: {DOCTOR_ID}\n")

    # 1. Register users
    print("[1/4] Registering users...")
    tokens = [register_user(i + 1) for i in range(NUM_THREADS)]  # display label is 1-based

    # 2. Pick the slot (use token[0] — any authenticated user works)
    print("\n[2/4] Picking a shared target slot...")
    slot_id = pick_slot(tokens[0])

    # 3. Fire concurrent requests
    print(f"\n[3/4] Firing {NUM_THREADS} concurrent booking requests for slot {slot_id}...")
    results = [None] * NUM_THREADS
    barrier = threading.Barrier(NUM_THREADS)
    threads = [
        threading.Thread(
            target=attempt_booking,
            args=(i, tokens[i], slot_id, results, barrier),
        )
        for i in range(NUM_THREADS)
    ]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    # 4. Assert outcome
    print("\n[4/4] Evaluating results...")
    successes = [s for s in results if s == 201]
    conflicts = [s for s in results if s == 409]
    others = [s for s in results if s not in (201, 409)]

    print(f"  201 Created  : {len(successes)}")
    print(f"  409 Conflict : {len(conflicts)}")
    if others:
        print(f"  Other        : {others}")

    ok = len(successes) == 1 and len(conflicts) == NUM_THREADS - 1 and not others

    print("\n" + "=" * 60)
    if ok:
        print(
            f"  [PASS] Exactly 1 booking succeeded and "
            f"{NUM_THREADS - 1} were correctly rejected with 409."
        )
        print("  Pessimistic locking is working correctly.")
        print("=" * 60)
        print("\n[SUCCESS] Concurrency test passed!")
    else:
        print(
            f"  [FAIL] Expected 1×201 + {NUM_THREADS - 1}×409, "
            f"got {len(successes)}×201 + {len(conflicts)}×409."
        )
        print("=" * 60)
        print("\n[ERROR] Concurrency test failed!")
        sys.exit(1)


if __name__ == "__main__":
    run_concurrency_test()
