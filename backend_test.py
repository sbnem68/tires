"""Checkpoint 0 Backend API Testing"""
import requests
import sys
import json

BASE_URL = "https://tire-match-intake--4mhfl8ll.preview.emergentagent.com/api"

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.tests = []
    
    def add_pass(self, test_name, details=""):
        self.passed += 1
        self.tests.append({"name": test_name, "status": "PASS", "details": details})
        print(f"✅ PASS: {test_name}")
        if details:
            print(f"   {details}")
    
    def add_fail(self, test_name, details=""):
        self.failed += 1
        self.tests.append({"name": test_name, "status": "FAIL", "details": details})
        print(f"❌ FAIL: {test_name}")
        if details:
            print(f"   {details}")
    
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"Test Summary: {self.passed}/{total} passed")
        print(f"{'='*60}")
        return self.failed == 0

def test_health_endpoint(results):
    """Test GET /api/health"""
    print("\n--- Testing Health Endpoint ---")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=10)
        
        if response.status_code != 200:
            results.add_fail("Health endpoint status code", f"Expected 200, got {response.status_code}")
            return
        
        data = response.json()
        
        # Check required fields
        if data.get("status") == "ok":
            results.add_pass("Health status is 'ok'")
        else:
            results.add_fail("Health status", f"Expected 'ok', got '{data.get('status')}'")
        
        if data.get("database") == "connected":
            results.add_pass("Database is connected")
        else:
            results.add_fail("Database connection", f"Expected 'connected', got '{data.get('database')}'")
        
        if data.get("migration_revision") == "0001":
            results.add_pass("Migration revision is 0001")
        else:
            results.add_fail("Migration revision", f"Expected '0001', got '{data.get('migration_revision')}'")
        
        if data.get("environment") == "staging":
            results.add_pass("Environment is staging")
        else:
            results.add_fail("Environment", f"Expected 'staging', got '{data.get('environment')}'")
            
    except Exception as e:
        results.add_fail("Health endpoint", f"Exception: {str(e)}")

def test_architecture_endpoint(results):
    """Test GET /api/system/architecture"""
    print("\n--- Testing Architecture Endpoint ---")
    try:
        response = requests.get(f"{BASE_URL}/system/architecture", timeout=10)
        
        if response.status_code != 200:
            results.add_fail("Architecture endpoint status code", f"Expected 200, got {response.status_code}")
            return
        
        data = response.json()
        
        # Test totals
        totals = data.get("totals", {})
        if totals.get("market_groups") == 14:
            results.add_pass("Market groups count is 14")
        else:
            results.add_fail("Market groups count", f"Expected 14, got {totals.get('market_groups')}")
        
        if totals.get("cities") == 28:
            results.add_pass("Cities count is 28")
        else:
            results.add_fail("Cities count", f"Expected 28, got {totals.get('cities')}")
        
        if totals.get("subareas") == 3:
            results.add_pass("Subareas count is 3")
        else:
            results.add_fail("Subareas count", f"Expected 3, got {totals.get('subareas')}")
        
        if totals.get("planning_prospects") == 348:
            results.add_pass("Planning prospects total is 348")
        else:
            results.add_fail("Planning prospects", f"Expected 348, got {totals.get('planning_prospects')}")
        
        # Test record counts (all should be 0)
        record_counts = data.get("record_counts", {})
        all_zero = all(v == 0 for v in record_counts.values())
        if all_zero:
            results.add_pass("All record counts are 0 (no business data)", f"{record_counts}")
        else:
            results.add_fail("Record counts", f"Expected all 0, got {record_counts}")
        
        # Test provinces
        provinces = data.get("provinces", [])
        if len(provinces) == 2:
            results.add_pass("Two provinces configured (ON, QC)")
        else:
            results.add_fail("Provinces count", f"Expected 2, got {len(provinces)}")
        
        # Check Gatineau is in QC
        market_groups = data.get("market_groups", [])
        gatineau_group = next((g for g in market_groups if g["slug"] == "gatineau"), None)
        if gatineau_group:
            gatineau_city = gatineau_group["cities"][0] if gatineau_group["cities"] else None
            if gatineau_city and gatineau_city["province_code"] == "QC":
                results.add_pass("Gatineau is in QC province")
                if "fr-CA" in gatineau_city["supported_locales"] and "en-CA" in gatineau_city["supported_locales"]:
                    results.add_pass("Gatineau supports fr-CA and en-CA")
                else:
                    results.add_fail("Gatineau locales", f"Expected fr-CA and en-CA, got {gatineau_city['supported_locales']}")
            else:
                results.add_fail("Gatineau province", "Gatineau should be in QC")
        else:
            results.add_fail("Gatineau market group", "Gatineau group not found")
        
        # Check Toronto has 3 subareas
        toronto_group = next((g for g in market_groups if g["slug"] == "toronto"), None)
        if toronto_group:
            toronto_city = toronto_group["cities"][0] if toronto_group["cities"] else None
            if toronto_city and len(toronto_city["subareas"]) == 3:
                expected_subareas = {"North York", "Scarborough", "Etobicoke"}
                actual_subareas = set(toronto_city["subareas"])
                if expected_subareas == actual_subareas:
                    results.add_pass("Toronto has correct 3 subareas", f"{toronto_city['subareas']}")
                else:
                    results.add_fail("Toronto subareas", f"Expected {expected_subareas}, got {actual_subareas}")
            else:
                results.add_fail("Toronto subareas count", f"Expected 3, got {len(toronto_city['subareas']) if toronto_city else 0}")
        
        # Check all cities are planned
        all_planned = True
        for group in market_groups:
            for city in group["cities"]:
                if city["launch_status"] != "planned":
                    all_planned = False
                    results.add_fail("City launch status", f"{city['name']} is {city['launch_status']}, expected 'planned'")
                    break
                if city["public_listing_enabled"] != False:
                    all_planned = False
                    results.add_fail("City public listing", f"{city['name']} has public_listing_enabled={city['public_listing_enabled']}, expected False")
                    break
            if not all_planned:
                break
        
        if all_planned:
            results.add_pass("All cities are 'planned' with public_listing_enabled=false")
        
        # Check no secrets in response
        response_text = json.dumps(data)
        if "DATABASE_URL" not in response_text and "postgresql://" not in response_text and "password" not in response_text.lower():
            results.add_pass("No database secrets in response")
        else:
            results.add_fail("Security check", "Response may contain database connection strings or secrets")
        
        # Check tables count
        tables = data.get("tables", [])
        if len(tables) == 15:
            results.add_pass("15 tables in schema")
        else:
            results.add_fail("Tables count", f"Expected 15, got {len(tables)}")
        
        # Check specific FK relationships
        required_fks = {
            "shops": "city_id",
            "prospects": "city_id",
            "leads": "requested_city_id",
            "shop_offers": "shop_id"
        }
        
        for table_name, fk_column in required_fks.items():
            table = next((t for t in tables if t["name"] == table_name), None)
            if table:
                fk_col = next((c for c in table["columns"] if c["name"] == fk_column), None)
                if fk_col and fk_col.get("references"):
                    results.add_pass(f"Table '{table_name}' has FK '{fk_column}'", f"→ {fk_col['references']}")
                else:
                    results.add_fail(f"Table '{table_name}' FK", f"Column '{fk_column}' should be a foreign key")
        
        # Verify specific market group counts
        test_groups = {
            "burlington-corridor": 47,
            "toronto": 57,
            "york-region": 34,
            "durham": 32,
            "sudbury": 5,
            "kingston": 4,
            "gatineau": 4
        }
        
        for slug, expected_count in test_groups.items():
            group = next((g for g in market_groups if g["slug"] == slug), None)
            if group and group["planning_prospect_count"] == expected_count:
                results.add_pass(f"Market group '{slug}' has count {expected_count}")
            else:
                actual = group["planning_prospect_count"] if group else "NOT FOUND"
                results.add_fail(f"Market group '{slug}' count", f"Expected {expected_count}, got {actual}")
        
    except Exception as e:
        results.add_fail("Architecture endpoint", f"Exception: {str(e)}")

def main():
    print("="*60)
    print("Checkpoint 0 Backend API Tests")
    print("="*60)
    
    results = TestResults()
    
    test_health_endpoint(results)
    test_architecture_endpoint(results)
    
    success = results.summary()
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
