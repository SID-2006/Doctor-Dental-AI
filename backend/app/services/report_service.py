import os
import logging
from pathlib import Path
from typing import Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Image as RLImage,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
)

from backend.app.schemas.analysis import AnalysisResponse

logger = logging.getLogger("dental_ai.report_service")

class ReportService:
    def generate_pdf_report(self, analysis: AnalysisResponse, analysis_dir: Path) -> Path:
        """Generate a clinical PDF diagnostic report using ReportLab."""
        pdf_path = analysis_dir / "report.pdf"
        doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36,
        )

        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            "DocTitle", parent=styles["Heading1"],
            fontSize=22, leading=26,
            textColor=colors.HexColor("#0F172A"), fontName="Helvetica-Bold",
        )
        subtitle_style = ParagraphStyle(
            "DocSubTitle", parent=styles["Normal"],
            fontSize=10, leading=14,
            textColor=colors.HexColor("#0D9488"), fontName="Helvetica-Bold",
        )
        meta_style = ParagraphStyle(
            "MetaText", parent=styles["Normal"],
            fontSize=8, leading=12, textColor=colors.HexColor("#64748B"),
        )
        section_heading = ParagraphStyle(
            "SectionHeading", parent=styles["Heading2"],
            fontSize=13, leading=17, textColor=colors.HexColor("#1E293B"),
            fontName="Helvetica-Bold", spaceBefore=10, spaceAfter=6,
        )
        body_text = ParagraphStyle(
            "Body", parent=styles["Normal"],
            fontSize=9, leading=13, textColor=colors.HexColor("#334155"),
        )
        label_style = ParagraphStyle(
            "Label", parent=styles["Normal"],
            fontSize=8.5, leading=12, textColor=colors.HexColor("#0F172A"),
            fontName="Helvetica-Bold",
        )
        disclaimer_style = ParagraphStyle(
            "Disclaimer", parent=styles["Normal"],
            fontSize=7.5, leading=11,
            textColor=colors.HexColor("#94A3B8"), fontName="Helvetica-Oblique",
        )
        table_header_style = ParagraphStyle(
            "TableHeader", parent=styles["Normal"],
            fontSize=8.5, leading=11,
            textColor=colors.HexColor("#FFFFFF"), fontName="Helvetica-Bold",
        )
        table_cell_style = ParagraphStyle(
            "TableCell", parent=styles["Normal"],
            fontSize=8, leading=11, textColor=colors.HexColor("#1E293B"),
        )

        story = []

        # ── Header ──────────────────────────────────────────────────────────
        header_data = [
            [
                Paragraph("<b>Doctor Dental</b> Diagnostic Report", title_style),
                Paragraph(
                    f"<b>Report ID:</b> {analysis.analysis_id[:12]}<br/>"
                    f"<b>Timestamp:</b> {analysis.created_at[:19]}<br/>"
                    f"<b>Status:</b> AI Review Completed",
                    meta_style,
                ),
            ],
            [
                Paragraph("Smart Dental Diagnosis & Restoration Decision Support System", subtitle_style),
                Paragraph("Reference: Research & Decision Support Prototype", meta_style),
            ],
        ]
        header_table = Table(header_data, colWidths=[4.2 * inch, 3.0 * inch])
        header_table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(header_table)
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0D9488"), spaceAfter=12))

        # ── Radiograph Visualizations ────────────────────────────────────────
        story.append(Paragraph("Radiographic Scan & Annotations", section_heading))
        orig_img_path = analysis_dir / "original.jpg"
        annot_img_path = analysis_dir / "annotated.jpg"

        if orig_img_path.exists() and annot_img_path.exists():
            img_cells = [
                [
                    RLImage(str(orig_img_path), width=3.5 * inch, height=2.1 * inch),
                    RLImage(str(annot_img_path), width=3.5 * inch, height=2.1 * inch),
                ],
                [
                    Paragraph("<b>Figure 1:</b> Original Radiograph", meta_style),
                    Paragraph("<b>Figure 2:</b> Multi-Model Overlay (Teeth & Lesions)", meta_style),
                ],
            ]
            img_table = Table(img_cells, colWidths=[3.6 * inch, 3.6 * inch])
            img_table.setStyle(TableStyle([
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            story.append(img_table)
        elif annot_img_path.exists():
            story.append(RLImage(str(annot_img_path), width=6.5 * inch, height=3.5 * inch))

        story.append(Spacer(1, 10))

        # ── Diagnostic Summary ───────────────────────────────────────────────
        story.append(Paragraph("Diagnostic Summary Overview", section_heading))
        summary_data = [
            [
                Paragraph("<b>Total Teeth Detected:</b>", body_text),
                Paragraph(str(analysis.enumeration.detections_count), body_text),
                Paragraph("<b>Disease Lesions Detected:</b>", body_text),
                Paragraph(str(analysis.disease_analysis.detections_count), body_text),
            ],
            [
                Paragraph("<b>Teeth With Findings:</b>", body_text),
                Paragraph(str(len(analysis.combined_findings)), body_text),
                Paragraph("<b>Missing Teeth (FDI):</b>", body_text),
                Paragraph(f"{len(analysis.enumeration.missing_teeth_fdi)} teeth", body_text),
            ],
        ]
        sum_table = Table(summary_data, colWidths=[1.8 * inch, 1.8 * inch, 1.8 * inch, 1.8 * inch])
        sum_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(sum_table)
        story.append(Spacer(1, 10))

        # ── Tooth-Wise Findings Table ────────────────────────────────────────
        story.append(Paragraph("Tooth-Specific Disease Findings", section_heading))
        if analysis.combined_findings:
            findings_table_data = [[
                Paragraph("FDI #", table_header_style),
                Paragraph("Anatomical Tooth Name", table_header_style),
                Paragraph("Findings Detected", table_header_style),
                Paragraph("Severity", table_header_style),
                Paragraph("Confidence", table_header_style),
            ]]
            for f in analysis.combined_findings:
                sev_color = "#DC2626" if f.highest_severity == "High" else "#D97706"
                findings_table_data.append([
                    Paragraph(f"<b>T{f.tooth_number}</b>", table_cell_style),
                    Paragraph(f.anatomical_name, table_cell_style),
                    Paragraph(", ".join(f.findings), table_cell_style),
                    Paragraph(f"<font color='{sev_color}'><b>{f.highest_severity}</b></font>", table_cell_style),
                    Paragraph(f"{f.confidence * 100:.1f}%", table_cell_style),
                ])
            ftable = Table(findings_table_data, colWidths=[0.8*inch, 2.7*inch, 2.0*inch, 0.9*inch, 0.8*inch])
            ftable.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#FFFFFF"), colors.HexColor("#F8FAFC")]),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ]))
            story.append(ftable)
        else:
            story.append(Paragraph("<i>No pathological disease lesions were associated with detected teeth.</i>", body_text))

        story.append(Spacer(1, 12))

        # ── Restoration Planning — Structured Clinical Guidance ──────────────
        # NOTE: Chairside diagnostic questions have been REMOVED from this report.
        # Each finding now shows: Clinical Interpretation, Recommended Next Step,
        # and Treatment Considerations (as possibilities, NOT prescriptions).
        if analysis.restoration_guidance:
            story.append(Paragraph("Restoration Planning — Clinical Guidance", section_heading))
            for g in analysis.restoration_guidance[:6]:
                card_data = [
                    [Paragraph(f"<b>Tooth T{g.tooth_number} — {g.anatomical_name}</b>  |  {g.condition}", label_style)],
                ]
                # Clinical Interpretation
                card_data.append([Paragraph("<b>Clinical Interpretation:</b>", body_text)])
                card_data.append([Paragraph(g.clinical_interpretation, body_text)])
                # Recommended Next Step
                card_data.append([Paragraph("<b>Recommended Next Step:</b>", body_text)])
                card_data.append([Paragraph(g.recommended_next_step, body_text)])
                # Treatment Considerations
                if g.treatment_considerations:
                    card_data.append([Paragraph("<b>Treatment Considerations:</b>", body_text)])
                    card_data.append([Paragraph(g.treatment_considerations, body_text)])

                card_table = Table(card_data, colWidths=[7.2 * inch])
                card_table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F0FDFA")),
                    ("BOX", (0, 0), (-1, -1), 0.75, colors.HexColor("#0D9488")),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ]))
                story.append(KeepTogether(card_table))
                story.append(Spacer(1, 6))

            story.append(Paragraph(
                "<i>Note: Restoration guidance is informational only and does not constitute a treatment prescription. "
                "All clinical decisions require examination by a licensed dental professional.</i>",
                disclaimer_style,
            ))

        story.append(Spacer(1, 10))

        # ── Alignment Screening Section ──────────────────────────────────────
        al = analysis.alignment_screening
        if al is not None:
            story.append(Paragraph("Tooth Alignment Screening", section_heading))
            if not al.sufficient_data:
                story.append(Paragraph(
                    f"<i>Alignment screening could not be completed: {al.insufficient_data_reason}</i>",
                    body_text,
                ))
            else:
                story.append(Paragraph(
                    f"Arch(es) analysed: <b>{al.arch.capitalize()}</b>  |  "
                    f"Teeth analysed: <b>{al.teeth_analyzed}</b>  |  "
                    f"Regions flagged for review: <b>{al.flagged_count}</b>",
                    body_text,
                ))
                story.append(Spacer(1, 6))

                if al.findings:
                    al_data = [[
                        Paragraph("Region / Tooth", table_header_style),
                        Paragraph("Deviation from Arch Curve", table_header_style),
                        Paragraph("Description", table_header_style),
                    ]]
                    for finding in al.findings:
                        dev_text = (
                            f"{finding.deviation_px:.0f} px "
                            f"({finding.deviation_normalized * 100:.0f}% of avg tooth width)"
                            if finding.deviation_px is not None else "—"
                        )
                        al_data.append([
                            Paragraph(finding.region, table_cell_style),
                            Paragraph(dev_text, table_cell_style),
                            Paragraph(finding.description, table_cell_style),
                        ])
                    al_table = Table(al_data, colWidths=[1.8*inch, 1.6*inch, 3.8*inch])
                    al_table.setStyle(TableStyle([
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#FFFFFF"), colors.HexColor("#F8FAFC")]),
                        ("TOPPADDING", (0, 0), (-1, -1), 4),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                        ("LEFTPADDING", (0, 0), (-1, -1), 6),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ]))
                    story.append(al_table)
                    story.append(Spacer(1, 6))
                else:
                    story.append(Paragraph(
                        "<i>No regions were flagged for alignment review based on the current geometric analysis.</i>",
                        body_text,
                    ))

            story.append(Paragraph(al.limitation_note, disclaimer_style))
            story.append(Spacer(1, 10))

        # ── Treating Dentist Verification ────────────────────────────────────
        dentist_box = [
            [
                Paragraph("<b>Treating Dentist Verification & Signature</b>", body_text),
                Paragraph("<b>Clinical Notes & Prescription</b>", body_text),
            ],
            [
                Paragraph("<br/><br/>________________________________________<br/>Doctor Signature & License #", body_text),
                Paragraph("<br/><br/>Date: ________________________", body_text),
            ],
        ]
        dtable = Table(dentist_box, colWidths=[3.6 * inch, 3.6 * inch])
        dtable.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#94A3B8")),
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FAFAFA")),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(KeepTogether(dtable))
        story.append(Spacer(1, 14))

        # ── Regulatory Disclaimer ─────────────────────────────────────────────
        story.append(Paragraph(
            "<b>REGULATORY NOTICE & CLINICAL LIMITATIONS:</b> "
            "This document is automatically generated by Doctor Dental prototype software using trained convolutional models "
            "(YOLO11m Enumeration & YOLO11m Disease). Artificial intelligence predictions are purely probabilistic and decision-supportive. "
            "They DO NOT constitute clinical diagnosis, surgical plans, or medical prescriptions. "
            "Definitive diagnosis requires chairside clinical examination, tactile probing, patient history, and validation by a licensed practitioner. "
            "Tooth alignment screening is a preliminary 2D geometric analysis and does not replace orthodontic assessment.",
            disclaimer_style,
        ))

        doc.build(story)
        logger.info(f"PDF report generated successfully at {pdf_path}")
        return pdf_path

report_service = ReportService()
