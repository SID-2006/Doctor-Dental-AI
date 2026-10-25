# Security Policy

## Supported Versions

We actively maintain and provide security patches for the following versions of **Doctor Dental**:

| Version | Supported          | Notes |
| ------- | ------------------ | ----- |
| `main`  | :white_check_mark: | Latest development branch and patches |
| 1.0.x   | :white_check_mark: | Current stable release |
| < 1.0   | :x:                | Older prototype commits |

---

## Reporting a Vulnerability

We take the security and integrity of medical software seriously. If you discover a security vulnerability or potential risk, please report it privately rather than opening a public issue.

### How to Report

1. **GitHub Private Vulnerability Advisory** *(Preferred)*:
   - Go to the **Security** tab of this repository.
   - Click **Report a vulnerability** to submit a confidential report.
2. **Direct Email**:
   - Alternatively, email the maintainer directly at: `siddhantwadher31@gmail.com` with the subject line: `[SECURITY] Doctor Dental Vulnerability Report`.

### What to Include in Your Report

To help us investigate and resolve the issue quickly, please include:
- A clear description of the vulnerability.
- Steps to reproduce the vulnerability (including proof-of-concept scripts, payloads, or sample images if applicable).
- The potential security impact (e.g., arbitrary file read, path traversal, denial of service).
- Your suggested remediation or fix, if you have one.
- Any environment details (OS, Python version, Node.js version, browser).

---

## Response & Disclosure Process

- **Initial Response**: You will receive an acknowledgment within **48 hours** confirming that we received your report.
- **Triage & Assessment**: Within **5 business days**, we will assess the validity and severity of the report and provide an update on next steps.
- **Remediation & Patching**: A security fix will be prepared and tested. We will coordinate with you on the timeline.
- **Coordinated Disclosure**: Once a patch is released, credit will be given in the release notes (unless you request to remain anonymous). Please allow reasonable time for the issue to be addressed before publicly disclosing any details.

---

## Security Architecture & Best Practices

Doctor Dental incorporates security considerations tailored for health tech software:

- **Local-First Processing**: Neural network inference and geometric alignment analysis run 100% on the local host by default. Patient radiographs are not transmitted to third-party cloud services.
- **Path Traversal Guards**: The filesystem storage layer uses cryptographically random UUIDs (`scan_<uuid>`) and enforces canonical path traversal checks before accessing images or generated reports on disk.
- **Image Validation & Sanitization**: Radiograph uploads are validated via Pillow and OpenCV to reject malformed byte streams, unsupported MIME types, and files exceeding size limits before passing data to YOLO11 inference pipelines.
- **Patient Privacy**: Users are advised to ensure all panoramic radiographs uploaded for testing are stripped of unmasked Protected Health Information (PHI) / patient identifying banners.
