import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api/ml"

valid_payload = {
  "task_complexity": 8,
  "task_type": "Backend",
  "task_priority": "P1",
  "remaining_work_fraction": 0.60,
  "task_progress": 40.0,
  "estimated_remaining_hours": 15.0,
  "dependency_count": 2,
  "downstream_dependency_count": 1,
  "upstream_dependency_count": 1,
  "task_age_hours": 24.0,
  "ownership_changes": 1,
  "number_of_reopens": 0,
  "number_of_status_changes": 2,
  "role": "Lead",
  "relevant_experience": 4.0,
  "similar_task_count": 12,
  "technology_familiarity": 4.0,
  "project_familiarity": 3.0,
  "repository_familiarity": 3.0,
  "current_workload_hours": 32.0,
  "concurrent_task_count": 3,
  "context_score": 7.5,
  "architecture_familiarity": 4.0,
  "architecture_stability": 6.0,
  "dependency_familiarity": 3.0,
  "current_task_involvement": 8.0,
  "hours_until_deadline": 72.0,
  "deadline_pressure": 0.8,
  "deadline_hours": 120.0,
  "team_size": 5,
  "reviewer_available": 1
}

def test_endpoint(name, path, payload, expected_status=None):
    print(f"\n--- Testing {name} ---")
    try:
        response = requests.post(f"{BASE_URL}/{path}", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        if expected_status and response.status_code != expected_status:
            print(f"WARNING: Expected {expected_status}, got {response.status_code}")
    except Exception as e:
        print(f"Error connecting: {e}")

if __name__ == "__main__":
    print("Running API tests...")
    
    # 1. Valid Duration
    test_endpoint("Valid Duration", "duration/", valid_payload)
    
    # 2. Valid Risk
    test_endpoint("Valid Risk", "risk/", valid_payload)
    
    # 3. Missing Feature (400)
    missing_payload = valid_payload.copy()
    del missing_payload["task_type"]
    test_endpoint("Missing Feature (Duration)", "duration/", missing_payload, 400)
    
    # 4. Invalid Categorical Value (400)
    invalid_cat_payload = valid_payload.copy()
    invalid_cat_payload["task_type"] = "Magic"
    test_endpoint("Invalid Category (Duration)", "duration/", invalid_cat_payload, 400)
    
    # 5. Invalid Numeric Type (400)
    invalid_num_payload = valid_payload.copy()
    invalid_num_payload["task_complexity"] = "high"
    test_endpoint("Invalid Numeric (Risk)", "risk/", invalid_num_payload, 400)
    
    # 6. Changed input to verify output change (if model loads successfully)
    changed_payload = valid_payload.copy()
    changed_payload["task_complexity"] = 10
    changed_payload["estimated_remaining_hours"] = 30.0
    test_endpoint("Changed Input (Duration)", "duration/", changed_payload)
    test_endpoint("Changed Input (Risk)", "risk/", changed_payload)
