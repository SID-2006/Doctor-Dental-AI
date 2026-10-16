import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_full_pipeline_with_real_inference_and_report(client):
    sample_path = Path("backend/samples/sample_panoramic.jpg")
    assert sample_path.exists(), "Sample test image must exist"
    
    with open(sample_path, "rb") as f:
        response = client.post(
            "/api/analyze",
            files={"file": ("sample_panoramic.jpg", f, "image/jpeg")},
            data={"enumeration_conf": "0.10", "disease_conf": "0.10"},
        )
        
    assert response.status_code == 200, f"Analysis failed: {response.text}"
    data = response.json()
    
    analysis_id = data["analysis_id"]
    assert analysis_id.startswith("scan_")
    assert "enumeration" in data
    assert "disease_analysis" in data
    assert "combined_findings" in data
    assert "restoration_guidance" in data
    assert "alignment_screening" in data
    assert "disclaimer" in data

    # Check alignment screening output
    align_res = data["alignment_screening"]
    assert align_res is not None
    assert "sufficient_data" in align_res
    assert "limitation_note" in align_res
    assert "findings" in align_res
    assert "arch_curve_points" in align_res
    assert "tooth_centers" in align_res
    assert "spacing_ratios" in align_res

    # Check restoration guidance structure (no question lists, structured fields)
    for g in data["restoration_guidance"]:
        assert "clinical_interpretation" in g
        assert len(g["clinical_interpretation"]) > 0
        assert "recommended_next_step" in g
        assert len(g["recommended_next_step"]) > 0
        assert "treatment_considerations" in g
        assert isinstance(g["treatment_considerations"], str)
        assert g.get("evaluation_questions", []) == []
    
    # Check tooth enumeration detections
    enum_res = data["enumeration"]
    assert enum_res["detections_count"] > 0
    assert len(enum_res["teeth"]) > 0
    first_tooth = enum_res["teeth"][0]
    assert "fdi_number" in first_tooth
    assert "anatomical_name" in first_tooth
    assert "box" in first_tooth
    
    # Check disease detections
    dis_res = data["disease_analysis"]
    assert dis_res["detections_count"] > 0
    assert len(dis_res["diseases"]) > 0
    first_disease = dis_res["diseases"][0]
    assert "disease_name" in first_disease
    assert "confidence" in first_disease
    assert "box" in first_disease
    
    # Test retrieving the analysis by ID
    get_res = client.get(f"/api/analysis/{analysis_id}")
    assert get_res.status_code == 200
    assert get_res.json()["analysis_id"] == analysis_id
    
    # Test retrieving original image
    img_orig = client.get(f"/api/analysis/{analysis_id}/image/original")
    assert img_orig.status_code == 200
    assert img_orig.headers["content-type"] == "image/jpeg"
    
    # Test retrieving annotated image
    img_annot = client.get(f"/api/analysis/{analysis_id}/image/annotated")
    assert img_annot.status_code == 200
    assert img_annot.headers["content-type"] == "image/jpeg"
    
    # Test retrieving teeth-only and diseases-only images
    img_teeth = client.get(f"/api/analysis/{analysis_id}/image/teeth_only")
    assert img_teeth.status_code == 200
    img_diseases = client.get(f"/api/analysis/{analysis_id}/image/diseases_only")
    assert img_diseases.status_code == 200
    
    # Test downloading PDF report
    report_res = client.get(f"/api/analysis/{analysis_id}/report")
    assert report_res.status_code == 200
    assert report_res.headers["content-type"] == "application/pdf"
    assert report_res.content.startswith(b"%PDF")
