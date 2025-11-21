"""
Test script for Admin API endpoints
Run with: python manage.py shell < test_admin_api.py
"""

import requests
import json

BASE_URL = "http://localhost:8000/api"

# Test credentials (you'll need to create an admin user first)
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"

def test_admin_login():
    """Test admin login and get token"""
    print("\n=== Testing Admin Login ===")
    response = requests.post(f"{BASE_URL}/auth/jwt/create/", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    
    if response.status_code == 200:
        data = response.json()
        print("✓ Login successful")
        print(f"Access Token: {data['access'][:50]}...")
        return data['access']
    else:
        print(f"✗ Login failed: {response.status_code}")
        print(response.text)
        return None


def test_dashboard(token):
    """Test dashboard overview endpoint"""
    print("\n=== Testing Dashboard Overview ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/dashboard/", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print("✓ Dashboard data retrieved")
        print(f"Stats: {json.dumps(data['stats'], indent=2)}")
        print(f"Alerts: {len(data['alerts'])} alerts")
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)


def test_users_list(token):
    """Test users list endpoint"""
    print("\n=== Testing Users List ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/users/", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Retrieved {len(data)} users")
        if data:
            print(f"Sample user: {data[0]['email']} - {data[0]['role']}")
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)


def test_properties_list(token):
    """Test properties list endpoint"""
    print("\n=== Testing Properties List ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/properties/", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✓ Retrieved {len(data)} properties")
        if data:
            print(f"Sample property: {data[0]['title']} - ${data[0]['price']}")
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)


def test_reports(token):
    """Test reports endpoint"""
    print("\n=== Testing Reports ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/reports/", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print("✓ Reports data retrieved")
        print(f"User Stats: {data['userStats']}")
        print(f"Property Stats: {data['propertyStats']}")
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)


def test_settings(token):
    """Test settings endpoint"""
    print("\n=== Testing Settings ===")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/settings/", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print("✓ Settings retrieved")
        print(f"Platform Fee: {data.get('platformFee')}%")
        print(f"Max Applications: {data.get('maxApplicationsPerStudent')}")
    else:
        print(f"✗ Failed: {response.status_code}")
        print(response.text)


def run_all_tests():
    """Run all admin API tests"""
    print("=" * 60)
    print("ADMIN API TEST SUITE")
    print("=" * 60)
    
    # Login first
    token = test_admin_login()
    if not token:
        print("\n✗ Cannot proceed without valid token")
        return
    
    # Run all tests
    test_dashboard(token)
    test_users_list(token)
    test_properties_list(token)
    test_reports(token)
    test_settings(token)
    
    print("\n" + "=" * 60)
    print("TEST SUITE COMPLETED")
    print("=" * 60)


if __name__ == "__main__":
    run_all_tests()
