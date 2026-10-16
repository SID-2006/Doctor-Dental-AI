import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_missing_analysis_404(client):
    response = client.get("/api/analysis/nonexistent_id_99999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()

def test_reject_unsupported_file_extension(client):
    file_content = b"Not an image file"
    files = {"file": ("document.txt", io.BytesIO(file_content), "text/plain")}
    response = client.post("/api/analyze", files=files)
    assert response.status_code == 400
    assert "unsupported file format" in response.json()["detail"].lower()

def test_reject_corrupted_image(client):
    fake_png = b"\x89PNG\r\n\x1a\ncorrupted_content_here"
    files = {"file": ("corrupt.png", io.BytesIO(fake_png), "image/png")}
    response = client.post("/api/analyze", files=files)
    assert response.status_code == 400
    assert "invalid or corrupted" in response.json()["detail"].lower()
