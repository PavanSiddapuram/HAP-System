import time
import sys
import random
import urllib.request
import urllib.error
import json
import psycopg2

BACKEND_URL = "http://backend:8080"
DB_CONN_STR = "host=postgres dbname=healthcare_db user=postgres password=postgres"

def print_header(title):
    print(f"\n========================================\n★ {title}\n========================================")

def http_post(url, data, token=None):
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), method='POST')
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8')), resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return json.loads(body), e.code
        except Exception:
            return {"error": body}, e.code

def http_get(url, token=None):
    req = urllib.request.Request(url, method='GET')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8')), resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return json.loads(body), e.code
        except Exception:
            return {"error": body}, e.code

def http_put(url, data=None, token=None):
    req_data = json.dumps(data).encode('utf-8') if data else b''
    req = urllib.request.Request(url, data=req_data, method='PUT')
    if req_data:
        req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode('utf-8')), resp.status
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            return json.loads(body), e.code
        except Exception:
            return {"error": body}, e.code

def run_tests():
    print_header("STARTING INTEGRATION VERIFICATION")
    
    # 1. User Registration
    email = f"test_user_{random.randint(1000, 9999)}@example.com"
    print(f"[*] Registering user: {email}...")
    reg_data = {
        "fullName": "Test Integration User",
        "email": email,
        "password": "Password123!",
        "phone": "+1234567890"
    }
    res, status = http_post(f"{BACKEND_URL}/api/auth/register", reg_data)
    if status not in (200, 201):
        print(f"[-] Registration failed with status {status}: {res}")
        sys.exit(1)
    
    token = res["token"]
    print(f"[+] Registration successful. JWT Token obtained: {token[:20]}...")
    
    # 2. Fetch Doctors
    print("\n[*] Fetching doctors...")
    res, status = http_get(f"{BACKEND_URL}/api/doctors", token)
    if status != 200 or not res:
        print(f"[-] Fetching doctors failed: {res}")
        sys.exit(1)
    
    doctors = res
    print(f"[+] Found {len(doctors)} doctors:")
    for doc in doctors:
        print(f"    - ID: {doc['id']}, Name: {doc['name']} ({doc['specialization']})")
    
    target_doctor = doctors[0]
    
    # 3. Fetch Available Slots for Today
    import datetime
    today = datetime.date.today().strftime("%Y-%m-%d")
    print(f"\n[*] Fetching available slots for {target_doctor['name']} on {today}...")
    url = f"{BACKEND_URL}/api/slots?date={today}&doctorId={target_doctor['id']}"
    res, status = http_get(url, token)
    if status != 200:
        print(f"[-] Fetching slots failed: {res}")
        sys.exit(1)
    
    slots = res
    available_slots = slots
    print(f"[+] Found {len(slots)} available slots.")
    
    if not available_slots:
        print("[-] No available slots found for testing.")
        sys.exit(1)
        
    test_slot = available_slots[0]
    print(f"    - Selected slot ID {test_slot['id']}: {test_slot['startTime']} to {test_slot['endTime']}")
    
    # 4. Book Appointment
    print(f"\n[*] Booking appointment for slot ID {test_slot['id']}...")
    booking_data = {
        "slotId": test_slot["id"],
        "notes": "Testing integration flow"
    }
    res, status = http_post(f"{BACKEND_URL}/api/appointments", booking_data, token)
    if status not in (200, 201):
        print(f"[-] Booking failed: {res}")
        sys.exit(1)
        
    app_id = res["id"]
    initial_status = res["status"]
    print(f"[+] Booking request successful. Appointment ID: {app_id}, Status: {initial_status}")
    if initial_status != "PENDING":
        print(f"[-] Expected initial status 'PENDING', got '{initial_status}'")
        sys.exit(1)
        
    # 5. Wait for Worker to process
    print("\n[*] Waiting 3 seconds for Python worker to consume event and process notification...")
    time.sleep(3)
    
    # 6. Fetch Appointment Details and Verify Status
    print("[*] Fetching appointment details to verify status update...")
    res, status = http_get(f"{BACKEND_URL}/api/appointments/{app_id}", token)
    if status != 200:
        print(f"[-] Fetching details failed: {res}")
        sys.exit(1)
        
    updated_status = res["status"]
    print(f"[+] Updated Status: {updated_status}")
    if updated_status != "CONFIRMED":
        print(f"[-] Verification failed! Expected status 'CONFIRMED', but got '{updated_status}'")
        sys.exit(1)
    else:
        print("[+] SUCCESS: Python worker successfully consumed queue event and updated status to CONFIRMED")
        
    # 7. Check Logs in Response
    print("\n[*] Verifying appointment logs:")
    logs = res.get("logs", [])
    for log in logs:
        print(f"    - [{log['timestamp']}] {log['previousStatus']} -> {log['newStatus']}: {log['message']}")
        
    # Check Database directly for notifications table
    print("\n[*] Checking PostgreSQL for notification entry...")
    try:
        conn = psycopg2.connect(DB_CONN_STR)
        cur = conn.cursor()
        cur.execute("SELECT type, recipient, status, sent_at FROM notifications WHERE appointment_id = %s", (app_id,))
        notification = cur.fetchone()
        if notification:
            print(f"[+] Found Notification in DB: Type={notification[0]}, Recipient={notification[1]}, Status={notification[2]}, SentAt={notification[3]}")
        else:
            print("[-] No notification entry found in database.")
            sys.exit(1)
        cur.close()
        conn.close()
    except Exception as e:
        print(f"[-] DB check failed: {e}")
        sys.exit(1)
        
    # 8. Try Concurrent / Duplicate Booking Prevention
    print("\n[*] Attempting to double-book the same slot (Duplicate Prevention)...")
    res_dup, status_dup = http_post(f"{BACKEND_URL}/api/appointments", booking_data, token)
    print(f"[+] Double-booking request returned HTTP {status_dup}")
    if status_dup == 409:
        print("[+] SUCCESS: Backend correctly rejected duplicate booking with 409 Conflict")
    else:
        print(f"[-] FAILURE: Expected 409 Conflict, got {status_dup}: {res_dup}")
        sys.exit(1)
        
    # 9. Cancel Appointment
    print(f"\n[*] Cancelling appointment ID {app_id}...")
    res, status = http_put(f"{BACKEND_URL}/api/appointments/{app_id}/cancel", None, token)
    if status != 200:
        print(f"[-] Cancellation failed: {res}")
        sys.exit(1)
        
    print(f"[+] Cancellation request accepted. Current status: {res['status']}")
    
    # 10. Wait for cancellation event processing
    print("\n[*] Waiting 2 seconds for worker to process cancellation notification...")
    time.sleep(2)
    
    # 11. Verify Slot is released
    print("[*] Verifying slot is now available...")
    res_slot, status_slot = http_get(f"{BACKEND_URL}/api/slots?date={today}&doctorId={target_doctor['id']}", token)
    updated_slot = next((s for s in res_slot if s["id"] == test_slot["id"]), None)
    if updated_slot:
        print("[+] SUCCESS: Slot is successfully released and marked as available")
    else:
        print(f"[-] FAILURE: Slot is still marked as booked: {res_slot}")
        sys.exit(1)
        
    # Verify cancellation notification in DB
    print("\n[*] Checking PostgreSQL for cancellation notification entry...")
    try:
        conn = psycopg2.connect(DB_CONN_STR)
        cur = conn.cursor()
        cur.execute("SELECT type, recipient, status, sent_at FROM notifications WHERE appointment_id = %s AND type = 'APPOINTMENT_CANCELLATION'", (app_id,))
        notification = cur.fetchone()
        if notification:
            print(f"[+] Found Cancellation Notification in DB: Type={notification[0]}, Recipient={notification[1]}, Status={notification[2]}, SentAt={notification[3]}")
        else:
            print("[-] No cancellation notification entry found in database.")
            sys.exit(1)
        cur.close()
        conn.close()
    except Exception as e:
        print(f"[-] DB check failed: {e}")
        sys.exit(1)
        
    print_header("ALL INTEGRATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
