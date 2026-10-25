# Contributing to Doctor Dental

Thank you for your interest in contributing to **Doctor Dental**! We welcome contributions from dental professionals, computer vision researchers, software engineers, and open-source enthusiasts.

This document outlines the guidelines and workflow for contributing to the repository.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Local Development Setup](#local-development-setup)
  - [Prerequisites](#prerequisites)
  - [1. Fork & Clone](#1-fork--clone)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
- [Development Workflow](#development-workflow)
  - [Branch Naming](#branch-naming)
  - [Commit Message Conventions](#commit-message-conventions)
- [Coding Guidelines](#coding-guidelines)
  - [Backend (Python / FastAPI)](#backend-python--fastapi)
  - [Frontend (React / TypeScript / Tailwind CSS)](#frontend-react--typescript--tailwind-css)
  - [Clinical & Orthodontic Modules](#clinical--orthodontic-modules)
- [Running Tests](#running-tests)
- [Submitting a Pull Request (PR)](#submitting-a-pull-request-pr)
- [Questions or Feedback?](#questions-or-feedback)

---

## Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for everyone. Please be respectful, constructive, and collaborative in all communications, issues, and pull requests.

---

## How Can I Contribute?

You can contribute in many ways:
- **Bug Reports**: Open an issue detailing unexpected behavior, browser inconsistencies, or edge cases in inference/geometry.
- **Feature Requests**: Suggest new clinical modules, visualization tools, or orthodontic screening metrics.
- **Code Contributions**: Implement new features, optimize model inference pipelines, improve UI/UX, or write tests.
- **Documentation**: Improve guides, clarify radiographic metrics, fix typos, or translate documentation.
- **Clinical Review**: Dental professionals are encouraged to review rule-based restorative prompts, anatomical norms, and terminology.

---

## Local Development Setup

### Prerequisites
- **Python**: 3.10 – 3.14
- **Node.js**: v18.0.0 or higher (with `npm`)
- **Git**

### 1. Fork & Clone

```bash
git clone https://github.com/<your-username>/Dental-AI.git
cd Dental-AI
```

### 2. Backend Setup

#### Using Start Scripts:
- **Windows (PowerShell)**:
  ```powershell
  .\start_backend.ps1
  ```
- **macOS / Linux**:
  ```bash
  chmod +x start_backend.sh
  ./start_backend.sh
  ```

#### Manual Setup:
```bash
cd backend
python -m venv .venv

# Activate virtual environment
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Ensure model files are present in backend/
# - backend/enumeration.pt
# - backend/disease.pt

# Start API server
cd ..
uvicorn backend.app.main:app --host 0.0.0.0 --port 8005 --reload
```
The FastAPI documentation will be available at [http://localhost:8005/docs](http://localhost:8005/docs).

### 3. Frontend Setup

#### Using Start Scripts:
- **Windows (PowerShell)**:
  ```powershell
  .\start_frontend.ps1
  ```
- **macOS / Linux**:
  ```bash
  chmod +x start_frontend.sh
  ./start_frontend.sh
  ```

#### Manual Setup:
```bash
cd frontend
npm install
npm run dev -- --port 5175
```
The frontend application will be available at [http://localhost:5175](http://localhost:5175).

---

## Development Workflow

### Branch Naming
Create a descriptive branch for your work:
- `feat/add-root-canal-screening`
- `fix/diastema-caliper-offset`
- `docs/update-api-docs`
- `refactor/alignment-service`

```bash
git checkout -b feat/your-feature-name
```

### Commit Message Conventions
Follow [Conventional Commits](https://www.conventionalcommits.org/) format:
- `feat: add canine impaction angulation measurement`
- `fix: correct SVG bounding box scaling on high-DPI displays`
- `docs: update setup instructions in README`
- `test: add unit tests for midline diastema detection`
- `refactor: optimize polynomial curve fitting routine`

---

## Coding Guidelines

### Backend (Python / FastAPI)
- Adhere to **PEP 8** style guidelines.
- Use explicit type hints for all function arguments and return types.
- Define data transfer models with **Pydantic v2** in `backend/app/schemas/`.
- Keep API endpoints thin: encapsulate business logic inside `backend/app/services/`.
- Handle edge cases gracefully (e.g., zero teeth detected, partial scans, cropped radiographs).

### Frontend (React / TypeScript / Tailwind CSS)
- Use **strict TypeScript** types defined in `frontend/src/types/api.ts`. Avoid `any`.
- Adhere to the established **Doctor Dental** clinical design system: clean aesthetics, high-contrast dark viewer panels, and clear severity color tokens:
  - Caries / Pathologies: Coral / Rose (`#F43F5E`)
  - Deep Caries / Severe: Red (`#DC2626`)
  - Alignment / Arch Deviations: Amber / Gold (`#F59E0B`)
  - Midline Diastema: Indigo (`#6366F1`)
  - Rotations: Purple (`#9333EA`)
  - Normal / Healthy: Emerald (`#10B981`)
- Ensure all interactive elements provide accessible focus, hover states, and clear labels.

### Clinical & Orthodontic Modules
- **Transparency**: Document all geometric thresholds, anatomical aspect ratios, and formulas directly in code with explanatory comments.
- **Non-Prescriptive Wording**: Do not use definitive prescribing language (e.g., avoid *"tooth 16 requires immediate extraction"*). Instead, use assistive phrasing (e.g., *"clinical probing and vitality testing advised"*).
- **Disclaimers**: Maintain hard-coded 2D radiographic prototype limitation notices on any new diagnostic output.

---

## Running Tests

Before submitting a pull request, verify that all test suites pass:

### Backend Tests
```bash
# Windows
backend\.venv\Scripts\pytest backend/tests/ -v

# macOS / Linux
PYTHONPATH=. backend/.venv/bin/pytest backend/tests/ -v
```

To run only the orthodontic alignment unit tests:
```bash
backend\.venv\Scripts\pytest backend/tests/test_alignment_service.py -v
```

### Frontend Type Check & Build
Ensure there are no TypeScript compiler errors or bundle breakages:
```bash
cd frontend
npm run build
```

---

## Submitting a Pull Request (PR)

1. **Push your branch** to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```
2. **Open a Pull Request** against the `main` branch of `SID-2006/Dental-AI`.
3. **Fill out the PR description**:
   - What problem does this change solve?
   - How was it tested?
   - Screenshots / screencasts (especially for UI or visual overlay changes).
   - Any breaking changes or new dependencies introduced.
4. **Respond to review feedback**: We will review your code promptly and may suggest refinements.

---

## Questions or Feedback?

If you have questions, encounter a bug, or want to discuss a new feature idea before building it:
- Open a GitHub Issue: [https://github.com/SID-2006/Dental-AI/issues](https://github.com/SID-2006/Dental-AI/issues)

Thank you for helping make **Doctor Dental** better! 🦷✨
