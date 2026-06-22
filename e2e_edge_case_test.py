"""
Edge-case integration tests for the Healthcare Appointment Platform.

Covers:
  • Auth validation  (6 tests)
  • Security / authorization  (3 tests)
  • Business logic edge cases  (5 tests)

Run against the live stack:  python e2e_edge_case_test.py
"""

import datetime
import json
import random
import sys
import urllib.error
import urllib.request

BACKEND_URL = "http://localhost:8080"

# ── HTTP helpers (same pattern as functional_test.py) ──────────────────────


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


def http_get(url, token=None, raw_token=None):
    req = urllib.request.Request(url, method="GET")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    if raw_token:
        req.add_header("Authorization", f"Bearer {raw_token}")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8")), resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return json.loads(body), e.code
        except Exception:
            return {"error": body}, e.code


def http_put(url, data=None, token=None):
    req_data = json.dumps(data).encode("utf-8") if data else b""
    req = urllib.request.Request(url, data=req_data, method="PUT")
    if req_data:
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


# ── Test runner ────────────────────────────────────────────────────────────

passed = 0
failed = 0


def check(name, actual_status, expected_statuses):
    global passed, failed
    ok = actual_status in expected_statuses
    tag = "[PASS]" if ok else "[FAIL]"
    exp = expected_statuses[0] if len(expected_statuses) == 1 else expected_statuses
    print(f"  {tag} {name}  (expected {exp}, got {actual_status})")
    if ok:
        passed += 1
    else:
        failed += 1


def section(title):
    print(f"\n{'='*60}\n  {title}\n{'='*60}")


# ── Fixtures ───────────────────────────────────────────────────────────────

def register_user(suffix=""):
    tag = suffix or str(random.randint(10000, 99999))
    email = f"edge_{tag}@test.com"
    res, status = http_post(f"{BACKEND_URL}/api/auth/register", {
        "fullName": "Edge Test User",
        "email": email,
        "password": "Password123!",
        "phone": "+1234567890",
    })
    assert status in (200, 201), f"Fixture registration failed: {status} {res}"
    return email, res["token"]


def book_slot_for_user(token):
    today = datetime.date.today().strftime("%Y-%m-%d")
    slots, _ = http_get(f"{BACKEND_URL}/api/slots?date={today}&doctorId=1", token)
    assert slots, "No slots available for fixture booking"
    slot_id = slots[0]["id"]
    res, status = http_post(
        f"{BACKEND_URL}/api/appointments",
        {"slotId": slot_id, "notes": "edge case fixture"},
        token,
    )
    assert status in (200, 201), f"Fixture booking failed: {status} {res}"
    return res["id"]


# ══════════════════════════════════════════════════════════════════════════
#  GROUP 1 — Auth Validation
# ══════════════════════════════════════════════════════════════════════════

def test_auth_validation():
    section("GROUP 1 — Auth Validation (6 tests)")

    # 1. Duplicate email — register fresh, then repeat same email
    email, _ = register_user()  # random suffix guaranteed unique
    _, status = http_post(f"{BACKEND_URL}/api/auth/register", {
        "fullName": "Dup User", "email": email,
        "password": "Password123!", "phone": "+1234567890",
    })
    check("Duplicate email registration -> 400", status, [400])

    # 2. Invalid email format
    _, status = http_post(f"{BACKEND_URL}/api/auth/register", {
        "fullName": "Bad Email", "email": "notanemail",
        "password": "Password123!", "phone": "+1234567890",
    })
    check("Invalid email format -> 400", status, [400])

    # 3. Password too short (< 6 chars)
    _, status = http_post(f"{BACKEND_URL}/api/auth/register", {
        "fullName": "Short Pass",
        "email": f"shortpass_{random.randint(1000,9999)}@test.com",
        "password": "abc", "phone": "+1234567890",
    })
    check("Short password (< 6 chars) -> 400", status, [400])

    # 4. Missing / blank fullName
    _, status = http_post(f"{BACKEND_URL}/api/auth/register", {
        "fullName": "",
        "email": f"noname_{random.randint(1000,9999)}@test.com",
        "password": "Password123!", "phone": "+1234567890",
    })
    check("Blank fullName -> 400", status, [400])

    # 5. Wrong password login
    real_email, _ = register_user("wrongpw")
    _, status = http_post(f"{BACKEND_URL}/api/auth/login", {
        "email": real_email, "password": "WrongPassword!",
    })
    check("Wrong password login -> 401", status, [401])

    # 6. Non-existent user login
    _, status = http_post(f"{BACKEND_URL}/api/auth/login", {
        "email": "ghost@nowhere.com", "password": "Password123!",
    })
    check("Non-existent user login -> 401", status, [401])


# ══════════════════════════════════════════════════════════════════════════
#  GROUP 2 — Security / Authorization
# ══════════════════════════════════════════════════════════════════════════

def test_security():
    section("GROUP 2 — Security / Authorization (3 tests)")

    # 7. No JWT on protected endpoint
    _, status = http_get(f"{BACKEND_URL}/api/doctors")
    check("No JWT -> 403 on GET /api/doctors", status, [403])

    # 8. Malformed JWT
    _, status = http_get(f"{BACKEND_URL}/api/doctors", raw_token="this.is.garbage")
    check("Malformed JWT -> 401 or 403", status, [401, 403])

    # 9. Cross-user appointment cancellation
    _, token_a = register_user("usera")
    _, token_b = register_user("userb")
    # User A books an appointment
    appt_id = book_slot_for_user(token_a)
    # User B tries to cancel User A's appointment
    _, status = http_put(
        f"{BACKEND_URL}/api/appointments/{appt_id}/cancel",
        token=token_b,
    )
    check("User B cancels User A's appointment -> 404", status, [404])
    # Clean up: User A cancels their own appointment
    http_put(f"{BACKEND_URL}/api/appointments/{appt_id}/cancel", token=token_a)


# ══════════════════════════════════════════════════════════════════════════
#  GROUP 3 — Business Logic Edge Cases
# ══════════════════════════════════════════════════════════════════════════

def test_business_edge_cases():
    section("GROUP 3 — Business Logic Edge Cases (5 tests)")

    _, token = register_user("biz")

    # 10. Book non-existent slot ID
    _, status = http_post(
        f"{BACKEND_URL}/api/appointments",
        {"slotId": 999999, "notes": "should fail"},
        token,
    )
    check("Book non-existent slot -> 404", status, [404])

    # 11. Book with missing slotId (null)
    _, status = http_post(
        f"{BACKEND_URL}/api/appointments",
        {"notes": "no slot id"},
        token,
    )
    check("Book with null slotId -> 400", status, [400])

    # 12. Cancel an already-cancelled appointment
    appt_id = book_slot_for_user(token)
    http_put(f"{BACKEND_URL}/api/appointments/{appt_id}/cancel", token=token)
    _, status = http_put(
        f"{BACKEND_URL}/api/appointments/{appt_id}/cancel", token=token
    )
    check("Cancel already-cancelled appointment -> 400", status, [400])

    # 13. Fetch slots without doctorId (all 3 doctors)
    today = datetime.date.today().strftime("%Y-%m-%d")
    slots, status = http_get(f"{BACKEND_URL}/api/slots?date={today}", token)
    check("Fetch all slots (no doctorId filter) -> 200", status, [200])
    if status == 200:
        doctor_ids = {s["doctorId"] for s in slots}
        all_doctors = len(doctor_ids) >= 3
        tag = "[PASS]" if all_doctors else "[FAIL]"
        print(f"  {tag} Slots span all 3 doctors  (got doctor IDs: {sorted(doctor_ids)})")
        global passed, failed
        if all_doctors:
            passed += 1
        else:
            failed += 1

    # 14. Appointments list for new user → empty array
    _, fresh_token = register_user("fresh")
    appointments, status = http_get(f"{BACKEND_URL}/api/appointments", fresh_token)
    check("New user appointments list -> 200", status, [200])
    is_empty = isinstance(appointments, list) and len(appointments) == 0
    tag = "[PASS]" if is_empty else "[FAIL]"
    print(f"  {tag} New user appointments list is empty  (got {appointments})")
    if is_empty:
        passed += 1
    else:
        failed += 1


# ══════════════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("  HAP-System - Edge Case Test Suite")
    print("=" * 60)
    print(f"[*] Targeting backend at: {BACKEND_URL}\n")

    test_auth_validation()
    test_security()
    test_business_edge_cases()

    total = passed + failed
    print(f"\n{'='*60}")
    print(f"  Results: {passed}/{total} passed  |  {failed} failed")
    print("=" * 60)

    if failed > 0:
        print(f"\n[ERROR] {failed} test(s) failed. See above for details.")
        sys.exit(1)
    else:
        print("\n[SUCCESS] All edge case tests passed!")
