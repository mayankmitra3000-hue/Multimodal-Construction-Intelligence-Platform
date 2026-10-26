from __future__ import annotations

import os

os.environ["AI_MODE"] = "mock"
os.environ.pop("GEMINI_API_KEY", None)

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.services.images import SAMPLE_PNG_BYTES  # noqa: E402


def _image_files(name: str = "site.png") -> dict:
    return {"image": (name, SAMPLE_PNG_BYTES, "image/png")}


def test_health_reports_mock_mode() -> None:
    with TestClient(app) as client:
        response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["ai"]["effective_mode"] == "mock"
    assert body["feature_count"] == 7


def test_safety_contract() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/safety/analyze",
            files=_image_files(),
            data={"notes": "Workers at level 2, one edge unprotected."},
        )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["meta"]["source"] == "mock"
    assert body["overall_risk"] in {"low", "medium", "high", "critical"}
    assert isinstance(body["hazards"], list)
    assert 0 <= body["compliance_score"] <= 100


def test_crack_contract() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/cracks/analyze",
            files=_image_files("crack.jpg"),
            data={"notes": "Diagonal crack in the basement retaining wall."},
        )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["crack_detected"] is True
    assert body["crack_type"] in {
        "hairline",
        "flexural",
        "shear",
        "settlement",
        "thermal",
        "corrosion",
        "shrinkage",
        "unknown",
    }
    assert body["estimated_repair_cost"]["currency"] == "USD"


def test_no_crack_path() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/cracks/analyze",
            files=_image_files(),
            data={"notes": "No visible crack, sound concrete surface."},
        )
    assert response.status_code == 200
    body = response.json()
    assert body["crack_detected"] is False
    assert body["repair_options"] == []


def test_valuation_contract() -> None:
    payload = {
        "location": "Downtown Dubai",
        "property_type": "apartment",
        "area_sqm": 120,
        "age_years": 4,
        "condition": "excellent",
        "bedrooms": 2,
        "bathrooms": 2,
        "amenities": ["gym", "pool"],
        "currency": "AED",
    }
    with TestClient(app) as client:
        response = client.post("/api/valuation/estimate", json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["estimated_value"]["currency"] == "AED"
    assert body["estimated_value"]["max"] > body["estimated_value"]["min"] > 0
    assert body["market_outlook"] in {"declining", "stable", "appreciating"}


def test_planning_contract_is_internally_consistent() -> None:
    payload = {
        "project_name": "Riverside Clinic",
        "description": "Three-storey reinforced concrete clinic with 40 parking bays.",
        "location": "Lagos",
        "budget": 2_500_000,
        "currency": "USD",
        "duration_weeks_target": 40,
        "team_size": 30,
        "constraints": ["occupied neighbouring site", "rainy season"],
    }
    with TestClient(app) as client:
        response = client.post("/api/planning/generate", json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    task_ids = {task["id"] for phase in body["phases"] for task in phase["tasks"]}
    assert body["critical_path"]
    assert set(body["critical_path"]).issubset(task_ids)
    assert body["phases"][0]["start_day"] == 1
    assert body["phases"][-1]["end_day"] == body["total_duration_days"]
    assert sum(line["percent"] for line in body["budget_breakdown"]) == 100
    assert body["budget_breakdown"][0]["amount"] == 200_000


def test_daily_contract() -> None:
    payload = {
        "notes": (
            "28 workers on site. Level 3 slab pour completed at 11:30. "
            "A shortage of rebar delayed the east core. Unsafe storage near the walkway. "
            "Need to inspect the formwork before tomorrow's pour."
        ),
        "weather": "Light rain in the afternoon",
        "priorities": ["Close out rebar delivery"],
    }
    with TestClient(app) as client:
        response = client.post("/api/daily/summarize", json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["key_updates"]
    assert body["issues"]
    assert body["action_items"]


def test_weather_contract() -> None:
    payload = {
        "location": "Manchester",
        "days": 4,
        "trade": "concrete",
        "activities": ["Concrete placement", "Steel erection", "Painting"],
    }
    with TestClient(app) as client:
        response = client.post("/api/weather/advisory", json=payload)
    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body["outlook"]) == 4
    assert len(body["suitability"]) == 3
    assert "not a live" in body["data_note"].lower()


def test_knowledge_with_image() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/knowledge/ask",
            files=_image_files(),
            data={"question": "What causes honeycombing in concrete?", "discipline": "structural"},
        )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["image_analyzed"] is True
    assert body["applicable_codes"]
    assert body["disclaimer"]


def test_knowledge_without_image() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/knowledge/ask",
            data={"question": "What is a hold point?", "discipline": "safety"},
        )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["image_analyzed"] is False
    assert body["meta"]["source"] == "mock"


def test_rejects_non_image_upload() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/safety/analyze",
            files={"image": ("notes.txt", b"not an image", "text/plain")},
        )
    assert response.status_code == 415


def test_validation_error_contract() -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/valuation/estimate",
            json={"location": "X", "property_type": "castle", "area_sqm": -1},
        )
    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "validation_error"
    assert isinstance(body["detail"], str)
