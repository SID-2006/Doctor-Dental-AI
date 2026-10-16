# DentalAI — Smart Dental Diagnosis and Restoration Planning Using Tooth Alignment Analysis

[![FastAPI](https://img.shields.io/badge/FastAPI-0.143-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.14-EE4C2C?style=flat&logo=pytorch)](https://pytorch.org)
[![Ultralytics](https://img.shields.io/badge/YOLO11m-Inference-blue?style=flat)](https://ultralytics.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com)
[![ReportLab](https://img.shields.io/badge/ReportLab-PDF_Reports-darkred?style=flat)](https://www.reportlab.com)

**DentalAI** is a local-first clinical decision support web application built for healthcare and dental diagnostics. It integrates two specialized deep learning models (`enumeration.pt` and `disesase.pt`) to simultaneously localize all 32 adult teeth using FDI standard notation, detect primary dental pathologies, correlate lesions with specific teeth via spatial bounding-box overlap, and compile diagnostic PDF reports.

---

## 1. System Overview & Core Capabilities

- **Tooth Enumeration & Odontogram Mapping (`enumeration.pt`)**:
  - Model Architecture: **YOLO11m Object Detector** trained on the DENTEX radiographic dataset.
  - Class Mapping: 32 standard adult FDI teeth across 4 anatomical quadrants:
    - Quadrant 1 (Upper Right): `11`, `12`, `13`, `14`, `15`, `16`, `17`, `18`
    - Quadrant 2 (Upper Left): `21`, `22`, `23`, `24`, `25`, `26`, `27`, `28`
    - Quadrant 3 (Lower Left): `31`, `32`, `33`, `34`, `35`, `36`, `37`, `38`
    - Quadrant 4 (Lower Right): `41`, `42`, `43`, `44`, `45`, `46`, `47`, `48`
  - Automatically identifies missing, impacted, or unerupted teeth.

- **Dental Disease Detection (`disesase.pt` / `disease.pt`)**:
  - Model Architecture: **YOLO11m Object Detector**.
  - Class Mapping (4 Pathologies):
    - `0: Impacted` — Tooth angulation or impaction against bone/structure
    - `1: Caries` — Enamel and superficial-to-moderate dentinal carious demineralization
    - `2: Periapical_Lesion` — Periapical inflammatory radiolucency / apical periodontitis
    - `3: Deep_Caries` — Advanced carious breakdown approaching or encroaching on pulp chamber

- **Spatial Overlap & Anatomical Association Engine**:
  - Automatically computes intersection over lesion area ($IoU / Area_{\text{lesion}} \ge 0.20$).
  - Maps detected pathologies directly to their corresponding FDI tooth numbers.
  - Accommodates periapical lesions extending beyond the anatomical root boundary with vertical tolerance.

- **Chairside Restoration Decision Support**:
  - Transparent, rule-based clinical prompts to assist treating dentists during chairside examination.
  - Prompts for pulp vitality testing, tactile proximal probing, and restoration margins.
  - Completely non-prescriptive: clearly separated from definitive dental diagnoses.

- **Automated Clinical PDF Reporting**:
  - Compiles diagnostic findings, original & annotated radiographs, tooth tables, and doctor signature block into a downloadable PDF report via ReportLab.

- **Interactive Medical Image Viewer**:
  - Toggle between All Annotations, Teeth Only, Diseases Only, and Original X-ray.
  - Zoom in/out, fit to screen, fullscreen mode.
  - Interactive SVG overlays synchronized with the odontogram and findings panel.

---

## 2. Technology Stack

### Backend
- **Python**: 3.10 – 3.14 compatible
- **FastAPI & Uvicorn**: High-performance asynchronous API
- **PyTorch & Ultralytics**: In-process YOLO11m inference (runs 100% on local CPU in ~270ms)
- **OpenCV & Pillow**: Radiograph validation and annotation rendering
- **ReportLab**: Vector PDF diagnostic report generation
- **Pydantic v2**: Strict schema validation

### Frontend
- **React 19 & TypeScript**: Strict component architecture
- **Vite**: Ultra-fast build & HMR tool
- **Tailwind CSS v4**: Healthcare clinical design system
- **Lucide React**: Clean medical iconography
- **React Router v7**: Multi-page client-side routing

---

## 3. Repository Structure

```
Dr.dental/
├── backend/
│   ├── enumeration.pt          # Trained YOLO11m tooth enumeration model (32 FDI classes)
│   ├── disesase.pt             # Trained YOLO11m disease model (symlink to disease.pt)
│   ├── disease.pt              # Trained YOLO11m disease model (4 pathology classes)
│   ├── requirements.txt        # Backend dependencies
│   ├── .env.example            # Backend environment configuration
│   ├── samples/                # Sample dental panoramic radiographs for testing
│   ├── app/
│   │   ├── main.py             # FastAPI entry point & CORS configuration
│   │   ├── config.py           # Configuration & path management
│   │   ├── api/
│   │   │   ├── health.py       # GET /api/health
│   │   │   ├── models.py       # GET /api/models/info
│   │   │   └── analysis.py     # POST /api/analyze, GET /api/analysis/{id}, reports
│   │   ├── services/
│   │   │   ├── model_service.py        # Singleton model loader & metadata introspector
│   │   │   ├── enumeration_service.py  # Tooth detection service
│   │   │   ├── disease_service.py      # Disease detection service
│   │   │   ├── association_service.py  # Spatial tooth-lesion overlap engine
│   │   │   ├── image_service.py        # Image validation & clinical overlay rendering
│   │   │   ├── guidance_service.py     # Rule-based restoration prompts
│   │   │   ├── report_service.py       # ReportLab PDF generator
│   │   │   └── analysis_service.py     # Complete orchestration service
│   │   ├── schemas/
│   │   │   └── analysis.py             # Pydantic data models
│   │   └── storage/
│   │       └── analysis_store.py       # Safe filesystem store (UUIDs, traversal guards)
│   ├── tests/
│   │   ├── test_health_and_models.py
│   │   ├── test_validation.py
│   │   └── test_real_inference_and_report.py
│   └── data/analyses/          # Local storage for scan images and generated reports
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── public/samples/         # Sample dental radiograph for UI preview
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── api/
│       │   ├── client.ts       # Centralized typed API client
│       │   └── types.ts        # TypeScript API interfaces
│       ├── components/
│       │   ├── layout/         # Navbar, Footer, AppLayout
│       │   ├── upload/         # UploadDropzone with drag-drop and sliders
│       │   ├── analysis/       # ImageViewer, Odontogram list, Findings, Guidance
│       │   └── common/         # Disclaimer, LoadingState, ErrorState
│       └── pages/
│           ├── HomePage.tsx
│           ├── AnalyzePage.tsx
│           ├── ResultsPage.tsx
│           ├── HowItWorksPage.tsx
│           ├── AboutPage.tsx
│           └── NotFoundPage.tsx
├── start_backend.ps1           # Windows PowerShell backend start script
├── start_frontend.ps1          # Windows PowerShell frontend start script
├── start_backend.sh            # macOS/Linux backend start script
├── start_frontend.sh           # macOS/Linux frontend start script
├── .gitignore
└── README.md
```

---

## 4. Quick Start Guide

### Option A: Windows PowerShell (Recommended)

1. **Start the Backend**:
   ```powershell
   .\start_backend.ps1
   ```
   *This automatically sets up `backend\.venv`, installs `requirements.txt`, loads the models, and starts Uvicorn at `http://localhost:8005`.*

2. **Start the Frontend** (in a second terminal):
   ```powershell
   .\start_frontend.ps1
   ```
   *This installs node dependencies and starts the Vite development server at `http://localhost:5175`.*

3. Open your browser and navigate to:
   - **Frontend UI**: [http://localhost:5175](http://localhost:5175)
   - **FastAPI Swagger Docs**: [http://localhost:8005/docs](http://localhost:8005/docs)
   - **Health Endpoint**: [http://localhost:8005/api/health](http://localhost:8005/api/health)

---

### Option B: macOS / Linux (Terminal)

1. **Set Up & Start Backend**:
   ```bash
   chmod +x start_backend.sh start_frontend.sh
   ./start_backend.sh
   ```
   *(Or manually:)*
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   cd ..
   export PYTHONPATH=.
   uvicorn backend.app.main:app --host 0.0.0.0 --port 8005 --reload
   ```

2. **Set Up & Start Frontend** (in a separate terminal):
   ```bash
   ./start_frontend.sh
   ```
   *(Or manually:)*
   ```bash
   cd frontend
   npm install
   npm run dev -- --host --port 5175
   ```

3. Open **`http://localhost:5175`** in your browser.

---

## 5. Automated Tests & Smoke Verification

We provide automated test suites covering API health, model metadata, image validation, 404 handling, real multi-model inference, and PDF report creation.

To run the backend test suite:
```bash
PYTHONPATH=. backend/.venv/bin/pytest backend/tests/ -v
```

**Test Coverage Summary**:
- `test_health_endpoint`: Validates that both `enumeration_model_ready` and `disease_model_ready` report `true`.
- `test_models_info_endpoint`: Confirms 32 FDI classes and 4 pathology classes match the trained checkpoints.
- `test_full_pipeline_with_real_inference_and_report`: Performs actual inference on a sample panoramic X-ray, asserts detected tooth boxes, verifies disease detection boxes, validates spatial association, and verifies `%PDF` file generation.
- `test_reject_unsupported_file_extension`: Rejects non-image files with HTTP 400.
- `test_reject_corrupted_image`: Rejects corrupted image bytes with HTTP 400.
- `test_missing_analysis_404`: Returns HTTP 404 for non-existent analysis IDs.

To test the frontend build:
```bash
cd frontend && npm run build
```

---

## 6. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Returns application status, device (`cpu`/`cuda`), and model readiness |
| `GET` | `/api/models/info` | Returns discovered architecture, 32 FDI tooth classes, and 4 disease classes |
| `POST` | `/api/analyze` | Accepts multipart image upload, executes dual-model inference, returns findings |
| `GET` | `/api/analysis/{id}` | Retrieves previously computed analysis results by UUID |
| `GET` | `/api/analysis/{id}/image/original` | Serves original uploaded radiograph |
| `GET` | `/api/analysis/{id}/image/annotated` | Serves clinical multi-layer annotated image |
| `GET` | `/api/analysis/{id}/image/teeth_only` | Serves teeth enumeration visualization layer |
| `GET` | `/api/analysis/{id}/image/diseases_only` | Serves disease lesion visualization layer |
| `GET` | `/api/analysis/{id}/report` | Generates and streams downloadable ReportLab PDF diagnostic report |

---

## 7. Medical Prototype Notice & Clinical Limitations

1. **Intended Use**: DentalAI is an assistive decision-support prototype built for educational and research evaluation.
2. **Probabilistic Outputs**: Detections represent statistical confidence bounds and do not establish clinical certainty.
3. **No Automatic Prescriptions**: Software does not prescribe crowns, restorations, implants, or extractions.
4. **Professional Responsibility**: All radiographic findings require independent verification by a licensed dental professional through clinical examination, tactile probing, and comprehensive patient history.
