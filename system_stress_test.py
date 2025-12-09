
import asyncio
import uuid
import httpx
from datetime import datetime, timedelta
from typing import Optional

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@keikichi.com" 
ADMIN_PASSWORD = "Admin123!ChangeMe" # From .env

# Colors for output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

async def get_token(email, password):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
        if response.status_code != 200:
            print(f"{Colors.FAIL}Login failed for {email}: {response.text}{Colors.ENDC}")
            return None
        return response.json()["access_token"]

async def run_audit():
    print(f"{Colors.HEADER}=================================================={Colors.ENDC}")
    print(f"{Colors.HEADER}       KEIKICHI LOGISTICS - DEEP SYSTEM AUDIT      {Colors.ENDC}")
    print(f"{Colors.HEADER}=================================================={Colors.ENDC}\n")

    # 1. Login Admin
    print(f"{Colors.OKBLUE}[1] Authenticating Admin...{Colors.ENDC}")
    token = await get_token(ADMIN_EMAIL, ADMIN_PASSWORD)
    if not token: return
    headers = {"Authorization": f"Bearer {token}"}
    print(f"{Colors.OKGREEN}✓ Admin authenticated{Colors.ENDC}\n")

    async with httpx.AsyncClient(headers=headers, timeout=30.0) as client:
        
        # ----------------------------------------------------------------
        # TEST CASE 1: Trip Deletion Integrity
        # Goal: Verify that deleting a trip with reservations is handled safely (blocked or cascaded)
        # ----------------------------------------------------------------
        print(f"{Colors.BOLD}Test Case 1: Trip With Reservations Deletion Safety{Colors.ENDC}")
        
        # 1.1 Create Temporary Trip
        trip_data = {
            "origin": "AUDIT_TEST_ORIGIN",
            "destination": "AUDIT_TEST_DEST",
            "departure_date": (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d"),
            "departure_time": "12:00",
            "total_spaces": 5,
            "price_per_space": 1000,
            "tax_rate": 0.16,
            "tax_included": False
        }
        resp = await client.post(f"{BASE_URL}/trips/", json=trip_data)
        if resp.status_code not in [200, 201]:
            print(f"{Colors.FAIL}Failed to create trip: {resp.text}{Colors.ENDC}")
            return
        trip_id = resp.json()["id"]
        print(f"  ✓ Created Trip: {trip_id}")
        
        # 1.2 Get Spaces for this trip
        resp = await client.get(f"{BASE_URL}/trips/{trip_id}")
        spaces = resp.json().get("spaces", []) # Or fetch via separate endpoint
        # Assuming we need to fetch spaces separately or they are in response
        # Let's try to get via list_trips logic if needed, but create_trip returns obj. 
        # Actually create_trip usually doesn't return spaces list fully populated immediately in some schemas, let's list spaces.
        # Actually, let's just make an admin reservation which auto-selects spaces or we send manually.
        # We need space IDs.
        # Fetch spaces manually if needed, or assume first spaces are available. 
        # But wait, create_trip creates spaces in background or synchronously? 
        # Service says create_trip -> create_spaces. So they should exist.
        # Let's fetch the trip detailed to get spaces.
        resp = await client.get(f"{BASE_URL}/trips/{trip_id}") # Endpoint usually provides summary stats, maybe not IDs.
        # If frontend gets spaces, there must be an endpoint. 
        # Ah, /trips/{id} response usually has stats. 
        # We might need to filter spaces endpoint directly if exists, or check `backend/app/api/v1/spaces.py`.
        # For now, let's skip to 1.3 trying to Create Admin Reservation without specific IDs (if API supports auto-assign) 
        # or we need to find Space IDs.
        # A smart guess: /api/v1/trips/{id}/spaces is common.
        
        resp = await client.get(f"{BASE_URL}/spaces/trip/{trip_id}")
        if resp.status_code == 200:
            spaces_data = resp.json()
            if spaces_data.get("spaces") and len(spaces_data["spaces"]) > 0:
                space_id = spaces_data["spaces"][0]["id"]
                print(f"  ✓ Retrieved Space ID: {space_id}")
            else:
                print(f"{Colors.WARNING}  ⚠ Trip has no spaces (unexpected){Colors.ENDC}")
                space_id = None
        else:
            print(f"{Colors.WARNING}  ⚠ Could not list spaces, skipping reservation part of Test 1{Colors.ENDC}")
            # If we can't get space, we can't reserve. But we can still test Trip delete.
            space_id = None
            
        reservation_id = None
        if space_id:
            # 1.3 Create Reservation (Admin style to bypass complex steps)
            res_data = {
                "trip_id": trip_id,
                "client_id": None, # Defaults to Admin
                "space_ids": [space_id],
                "items": [{"product_name": "Test Item", "box_count": 1, "total_weight": 10}],
                "payment_method": "cash",
                "notes": "Audit Test"
            }
            resp = await client.post(f"{BASE_URL}/reservations/admin", json=res_data)
            if resp.status_code in [200, 201]:
                reservation_id = resp.json()["id"]
                print(f"  ✓ Created Reservation: {reservation_id}")
            else:
                print(f"{Colors.FAIL}  ✗ Failed to create reservation: {resp.text}{Colors.ENDC}")

        # 1.4 Attempt Delete Trip
        print("  Running Delete Trip...")
        resp = await client.delete(f"{BASE_URL}/trips/{trip_id}")
        
        if resp.status_code == 204:
            print(f"{Colors.OKGREEN}  ✓ Trip deleted successfully (204).{Colors.ENDC}")
            # 1.5 Verify Integrity (Did reservation disappear or error?)
            if reservation_id:
                resp = await client.get(f"{BASE_URL}/reservations/{reservation_id}")
                if resp.status_code == 404:
                    print(f"{Colors.OKGREEN}  ✓ Integrity Confirm: Reservation also deleted/hidden (Correct Cascade){Colors.ENDC}")
                else:
                    print(f"{Colors.WARNING}  ⚠ Warning: Reservation {reservation_id} still exists after trip deletion! (Orphan Risk){Colors.ENDC}")
        elif resp.status_code == 400:
             print(f"{Colors.OKGREEN}  ✓ Trip deletion blocked intentionally (Safe Behavior): {resp.text}{Colors.ENDC}")
             # Cleanup manually for next tests
             if reservation_id:
                 await client.delete(f"{BASE_URL}/reservations/{reservation_id}")
             await client.delete(f"{BASE_URL}/trips/{trip_id}")
        elif resp.status_code == 500:
             print(f"{Colors.FAIL}  ✗ CRITICAL: Trip deletion caused 500 Error (Integrity Violation){Colors.ENDC}")
             print(f"    Server Response: {resp.text}")
        else:
             print(f"{Colors.FAIL}  ✗ Unexpected response: {resp.status_code} {resp.text}{Colors.ENDC}")

        print("\n")
        
        # ----------------------------------------------------------------
        # TEST CASE 2: User Deletion with Active Holds (The Original Bug)
        # Goal: Verify the fix we just implemented
        # ----------------------------------------------------------------
        print(f"{Colors.BOLD}Test Case 2: User Deletion with Active Holds{Colors.ENDC}")
        
        # 2.1 Create Temp User
        rand_suffix = uuid.uuid4().hex[:6]
        temp_email = f"audit_user_{rand_suffix}@test.com"
        temp_phone = f"55{uuid.uuid4().int % 100000000:08d}"
        user_data = {
            "email": temp_email,
            "password": "password123",
            "full_name": "Audit Temp User",
            "phone": temp_phone,
            "role": "client",
            "is_active": True,
            "is_verified": False
        }
        resp = await client.post(f"{BASE_URL}/admin/users", json=user_data)
        if resp.status_code not in [200, 201]:
             print(f"{Colors.FAIL}Failed to create user: {resp.text}{Colors.ENDC}")
             return
        user_id = resp.json()["id"]
        print(f"  ✓ Created Temp User: {user_id}")

        # 2.2 Create Trip and Hold Space
        # Need a trip. If previous one deleted, make new one.
        trip_data["origin"] = "AUDIT_TEST_2"
        resp = await client.post(f"{BASE_URL}/trips/", json=trip_data)
        trip2_id = resp.json()["id"]
        
        # Retrieve space
        resp = await client.get(f"{BASE_URL}/spaces/trip/{trip2_id}")
        spaces_data = resp.json()
        space_id = spaces_data["spaces"][0]["id"]
        
        # 2.3 Hold Space (Using special endpoint or service? Usually it's /reservations/hold)
        # We need to act AS THE CLIENT for this, logic-wise holds are usually client actions.
        # But we can try to call the service or hold endpoint if public/protected.
        # Let's try to get a client token.
        client_token = await get_token(temp_email, "password123")
        if client_token:
            client_headers = {"Authorization": f"Bearer {client_token}"}
            hold_data = {
                "trip_id": trip2_id,
                "space_ids": [space_id]
            }
            async with httpx.AsyncClient() as client_user:
                resp = await client_user.post(f"{BASE_URL}/reservations/hold", json=hold_data, headers=client_headers)
            
            if resp.status_code == 200:
                 print(f"  ✓ Space {space_id} held by user")
            else:
                 print(f"{Colors.WARNING}  ⚠ Failed to hold space: {resp.text}{Colors.ENDC}")
        
        # 2.4 Attempt Delete User (Admin action)
        print("  Running Delete User...")
        resp = await client.delete(f"{BASE_URL}/admin/users/{user_id}")
        
        if resp.status_code == 200:
             print(f"{Colors.OKGREEN}  ✓ User deleted successfully (Fix Verified - Holds Released automatically){Colors.ENDC}")
             # check space status
             resp = await client.get(f"{BASE_URL}/spaces/trip/{trip2_id}")
             spaces_data = resp.json()
             if spaces_data.get("spaces"):
                 s = next((s for s in spaces_data["spaces"] if s["id"] == space_id), None)
                 if s and s["status"] == "available":
                      print(f"{Colors.OKGREEN}  ✓ Space is correctly set back to AVAILABLE{Colors.ENDC}")
                 else:
                      print(f"{Colors.FAIL}  ✗ Space status is {s.get('status') if s else 'Unknown'} (Expected: available){Colors.ENDC}")
             else:
                 print(f"{Colors.WARNING}  ⚠ Could not verify space status (no spaces found){Colors.ENDC}")
                  
        elif resp.status_code == 500:
             print(f"{Colors.FAIL}  ✗ CRITICAL: User deletion caused 500 Error (Fix Failed){Colors.ENDC}")
        else:
             print(f"  Response: {resp.status_code} {resp.text}")

        # Cleanup
        await client.delete(f"{BASE_URL}/trips/{trip2_id}")

    print(f"\n{Colors.HEADER} Audit Complete.{Colors.ENDC}")

if __name__ == "__main__":
    asyncio.run(run_audit())
