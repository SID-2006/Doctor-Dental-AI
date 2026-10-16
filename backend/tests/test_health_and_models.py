import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.model_service import model_service

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["app_name"] == "DentalAI"
    assert "enumeration_model_ready" in data
    assert "disease_model_ready" in data
    assert data["enumeration_model_ready"] is True
    assert data["disease_model_ready"] is True
    assert data["status"] == "healthy"

def test_models_info_endpoint(client):
    response = client.get("/api/models/info")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"
    
    # Check enumeration model metadata
    enum_meta = data["enumeration"]
    assert enum_meta["ready"] is True
    assert len(enum_meta["classes"]) == 32
    assert "11" in enum_meta["classes"]
    assert "48" in enum_meta["classes"]
    
    # Check disease model metadata
    disease_meta = data["disease"]
    assert disease_meta["ready"] is True
    assert len(disease_meta["classes"]) == 4
    assert "Caries" in disease_meta["classes"]
    assert "Deep_Caries" in disease_meta["classes"]
    assert "Periapical_Lesion" in disease_meta["classes"]
    assert "Impacted" in disease_meta["classes"]
