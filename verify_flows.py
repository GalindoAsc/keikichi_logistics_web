import urllib.request
import urllib.error
import json
import time
import uuid

BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@keikichi.com"
ADMIN_PASSWORD = "Admin123!ChangeMe"

def request(method, endpoint, data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    if data:
        data_bytes = json.dumps(data).encode('utf-8')
    else:
        data_bytes = None
        
    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            status = response.status
            body = response.read().decode('utf-8')
            if body:
                return status, json.loads(body)
            return status, {}
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8')
        try:
            json_body = json.loads(body)
        except:
            json_body = body
        return e.code, json_body

def run_tests():
    print("🚀 Starting Functional Tests")
    
    # 1. Register User
    print("\n1️⃣  Registering new user...")
    user_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    user_password = "TestPassword123!"
    user_name = "Test User"
    
    status, res = request("POST", "/auth/register", {
        "email": user_email,
        "password": user_password,
        "full_name": user_name
    })
    
    if status in [200, 201]:
        print(f"✅ User registered: {user_email}")
        user_id = res["id"]
    else:
        print(f"❌ Registration failed: {status} - {res}")
        return

    # 1.5 Approve User (Admin)
    print("\n1️⃣.5️⃣  Approving user (Admin)...")
    # Login Admin first
    status, res = request("POST", "/auth/login", {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    if status == 200:
        admin_token = res["access_token"]
        print("✅ Admin login successful")
    else:
        print(f"❌ Admin login failed: {status} - {res}")
        return
        
    # Approve
    status, res = request("POST", f"/users/{user_id}/approve", {}, token=admin_token)
    
    if status == 200:
        print(f"✅ User approved: {user_id}")
    else:
        print(f"❌ User approval failed: {status} - {res}")
        return

    # 2. Login User
    print("\n2️⃣  Logging in user...")
    status, res = request("POST", "/auth/login", {
        "email": user_email,
        "password": user_password
    })
    
    if status == 200:
        user_token = res["access_token"]
        print("✅ Login successful")
    else:
        print(f"❌ Login failed: {status} - {res}")
        return

    # 3. Get Profile
    print("\n3️⃣  Getting user profile...")
    status, res = request("GET", "/auth/me", token=user_token)
    
    if status == 200:
        print(f"✅ Profile retrieved: {res['email']}")
    else:
        print(f"❌ Get profile failed: {status} - {res}")
        return

    # 4. Login Admin (Already logged in, reusing token)
    print("\n4️⃣  Using admin token...")
    # We already have admin_token from step 1.5


    # 5. Create Trip (Admin)
    print("\n5️⃣  Creating trip (Admin)...")
    trip_data = {
        "origin": "Mexico City",
        "destination": "Guadalajara",
        "departure_date": "2025-12-01",
        "departure_time": "08:00",
        "arrival_date": "2025-12-01",
        "arrival_time": "14:00",
        "price_per_space": 1500.00,
        "total_spaces": 10,
        "status": "scheduled"
    }
    
    status, res = request("POST", "/trips/", trip_data, token=admin_token)
    
    if status in [200, 201]:
        trip_id = res["id"]
        print(f"✅ Trip created: {trip_id}")
    else:
        print(f"❌ Create trip failed: {status} - {res}")
        return

    # 6. Search Trips (User)
    print("\n6️⃣  Searching trips (User)...")
    status, res = request("GET", "/trips", token=user_token)
    
    if status == 200:
        trips = res
        found = False
        for trip in trips:
            if trip["id"] == trip_id:
                found = True
                break
        if found:
            print("✅ Created trip found in search")
        else:
            print("❌ Created trip NOT found in search")
    else:
        print(f"❌ Search trips failed: {status} - {res}")
        return

    # 7. Get Trip Details & Spaces
    print("\n7️⃣  Getting trip details...")
    status, res = request("GET", f"/spaces/trip/{trip_id}", token=user_token)
    
    if status == 200:
        spaces = res["spaces"]
        available_spaces = [s for s in spaces if s["status"] == "available"]
        if available_spaces:
            space_id = available_spaces[0]["id"]
            print(f"✅ Found available space: {space_id}")
        else:
            print("❌ No available spaces found")
            return
    else:
        print(f"❌ Get trip details failed: {status} - {res}")
        return

    # 8. Hold Space
    print("\n8️⃣  Holding space...")
    hold_data = {
        "trip_id": trip_id,
        "space_ids": [space_id]
    }
    
    status, res = request("POST", "/reservations/hold", hold_data, token=user_token)
    
    if status == 200:
        print("✅ Space held successfully")
    else:
        print(f"❌ Hold space failed: {status} - {res}")
        return

    # 9. Create Reservation
    print("\n9️⃣  Creating reservation...")
    reservation_data = {
        "trip_id": trip_id,
        "space_ids": [space_id],
        "payment_method": "bank_transfer",
        "cargo_type": "Electronics",
        "cargo_description": "Laptops and monitors",
        "cargo_weight": 50.5,
        "cargo_value": 50000.00,
        "requires_invoice": True
    }
    
    status, res = request("POST", "/reservations/", reservation_data, token=user_token)
    
    if status in [200, 201]:
        reservation_id = res["id"]
        print(f"✅ Reservation created: {reservation_id}")
        print(f"   Status: {res['status']}")
        print(f"   Total Amount: {res['total_amount']}")
    else:
        print(f"❌ Create reservation failed: {status} - {res}")
        return

    print("\n✨ All functional tests passed!")

if __name__ == "__main__":
    run_tests()
