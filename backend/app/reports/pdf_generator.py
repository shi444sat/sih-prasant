"""
PDF Report Generator for Project Drishti
Generates professional infrastructure risk reports using ReportLab.
"""
import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.lib.units import inch

from app.models.projects import Project
from app.models.predictions import RiskPrediction
from app.models.alerts import Alert
from app.models.snapshots import ProjectSnapshot

def generate_project_pdf(project: Project, db) -> bytes:
    """
    Builds a structured, high-density executive intelligence PDF report for the project.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A')
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#2563EB')
    )
    disclaimer_style = ParagraphStyle(
        'Disclaimer',
        parent=styles['Italic'],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#B91C1C'),
        alignment=1 # Center
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=6
    )
    normal_text = ParagraphStyle(
        'NormalText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )
    bold_text = ParagraphStyle(
        'BoldText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0F172A')
    )

    elements = []

    # 1. Government Header & Disclaimers
    elements.append(Paragraph("PROJECT DRISHTI", title_style))
    elements.append(Paragraph("Infrastructure Project Intelligence & Early Warning System | MoSPI DIID", subtitle_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(
        "DEMO REPORT — SYNTHETIC DEMONSTRATION DATASET | Configurable prototype policy — not an official government threshold",
        disclaimer_style
    ))
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563EB'), spaceAfter=10))

    # 2. Project Overview Box
    snaps = db.query(ProjectSnapshot).filter(ProjectSnapshot.project_id == project.id).order_by(ProjectSnapshot.month.desc()).all()
    latest_snap = snaps[0] if snaps else None
    latest_pred = db.query(RiskPrediction).filter(RiskPrediction.project_id == project.id).order_by(RiskPrediction.created_at.desc()).first()

    exp = latest_snap.expenditure if latest_snap else 0.0
    phy = latest_snap.physical_progress if latest_snap else 0.0
    sch = latest_snap.schedule_progress if latest_snap else 0.0
    overall_risk = latest_pred.overall_risk if latest_pred else 0.0
    risk_band = latest_pred.risk_band if latest_pred else "LOW"

    # Color for risk band
    band_colors = {
        "LOW": colors.HexColor('#16A34A'),
        "MODERATE": colors.HexColor('#D97706'),
        "HIGH": colors.HexColor('#EA580C'),
        "CRITICAL": colors.HexColor('#DC2626')
    }
    band_col = band_colors.get(risk_band, colors.HexColor('#2563EB'))

    overview_data = [
        [
            Paragraph(f"<b>Project:</b> {project.name} ({project.code})", normal_text),
            Paragraph(f"<b>Status:</b> {project.status}", normal_text)
        ],
        [
            Paragraph(f"<b>Ministry:</b> {project.ministry}", normal_text),
            Paragraph(f"<b>Department:</b> {project.department}", normal_text)
        ],
        [
            Paragraph(f"<b>Sector:</b> {project.sector}", normal_text),
            Paragraph(f"<b>Agency:</b> {project.agency}", normal_text)
        ],
        [
            Paragraph(f"<b>Approved Cost:</b> ₹{project.approved_cost:,.2f} Cr", normal_text),
            Paragraph(f"<b>Revised Cost:</b> ₹{project.revised_cost:,.2f} Cr", normal_text)
        ],
        [
            Paragraph(f"<b>Timeline:</b> {project.start_date} to {project.target_date}", normal_text),
            Paragraph(f"<b>Last Reporting Month:</b> {latest_snap.month if latest_snap else 'N/A'}", normal_text)
        ]
    ]

    t_overview = Table(overview_data, colWidths=[4.0 * inch, 3.5 * inch])
    t_overview.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(t_overview)
    elements.append(Spacer(1, 10))

    # 3. Composite Risk & Key Indicators
    elements.append(Paragraph("Composite Risk & Analytical Indicators", section_heading))
    risk_summary_data = [
        [
            Paragraph("<b>Overall Risk Score</b>", normal_text),
            Paragraph("<b>Risk Classification</b>", normal_text),
            Paragraph("<b>Cost Risk</b>", normal_text),
            Paragraph("<b>Time Risk</b>", normal_text),
            Paragraph("<b>Progress Lag</b>", normal_text)
        ],
        [
            Paragraph(f"<b>{overall_risk:.1f}/100</b>", bold_text),
            Paragraph(f"<b><font color='{band_col.hexval()}'>{risk_band}</font></b>", bold_text),
            Paragraph(f"{latest_pred.cost_risk if latest_pred else 0.0:.1f}/100", normal_text),
            Paragraph(f"{latest_pred.time_risk if latest_pred else 0.0:.1f}/100", normal_text),
            Paragraph(f"{(sch - phy):.1f}%", normal_text)
        ],
        [
            Paragraph(f"<b>Financial Progress:</b> {(exp / project.revised_cost * 100):.1f}%", normal_text),
            Paragraph(f"<b>Physical Progress:</b> {phy:.1f}%", normal_text),
            Paragraph(f"<b>Schedule Target:</b> {sch:.1f}%", normal_text),
            Paragraph(f"<b>Milestone Risk:</b> {latest_pred.milestone_risk if latest_pred else 0.0:.1f}", normal_text),
            Paragraph(f"<b>Data Freshness:</b> 15 days", normal_text)
        ]
    ]
    t_risk = Table(risk_summary_data, colWidths=[1.5 * inch, 1.5 * inch, 1.5 * inch, 1.5 * inch, 1.5 * inch])
    t_risk.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EEF2F6')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#94A3B8')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(t_risk)
    elements.append(Spacer(1, 10))

    # 4. Explainable Risk Drivers (Why is this project at risk?)
    elements.append(Paragraph("Explainability: Key Contributing Signals & Evidence", section_heading))
    driver_rows = [
        [
            Paragraph("<b>Signal / Driver</b>", normal_text),
            Paragraph("<b>Contribution</b>", normal_text),
            Paragraph("<b>Evidence & Analytical Findings</b>", normal_text),
            Paragraph("<b>Observed Trend</b>", normal_text)
        ]
    ]

    if latest_pred and latest_pred.drivers:
        for drv in latest_pred.drivers:
            driver_rows.append([
                Paragraph(drv.driver, bold_text),
                Paragraph(f"+{drv.contribution:.1f} pts", normal_text),
                Paragraph(drv.evidence, normal_text),
                Paragraph(drv.trend, normal_text)
            ])
    else:
        driver_rows.append([
            Paragraph("Operational Variance", normal_text),
            Paragraph("+0.0 pts", normal_text),
            Paragraph("Project indicators within regular tolerances.", normal_text),
            Paragraph("Stable", normal_text)
        ])

    t_drivers = Table(driver_rows, colWidths=[1.8 * inch, 1.0 * inch, 3.7 * inch, 1.0 * inch])
    t_drivers.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EEF2F6')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#94A3B8')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(t_drivers)
    elements.append(Spacer(1, 10))

    # 5. Active Early Warning Alerts
    elements.append(Paragraph("Active Early Warnings & Action Items", section_heading))
    alerts = db.query(Alert).filter(Alert.project_id == project.id, Alert.status == "Active").all()
    alert_rows = [
        [
            Paragraph("<b>Severity</b>", normal_text),
            Paragraph("<b>Type</b>", normal_text),
            Paragraph("<b>Trigger & Evidence</b>", normal_text),
            Paragraph("<b>Assigned Owner</b>", normal_text)
        ]
    ]
    if alerts:
        for a in alerts:
            sev_col = band_colors.get(a.severity.upper(), colors.black)
            alert_rows.append([
                Paragraph(f"<b><font color='{sev_col.hexval()}'>{a.severity}</font></b>", bold_text),
                Paragraph(a.type, normal_text),
                Paragraph(f"{a.message}<br/><i>Evidence: {a.evidence}</i>", normal_text),
                Paragraph(a.owner, normal_text)
            ])
    else:
        alert_rows.append([
            Paragraph("None", normal_text),
            Paragraph("N/A", normal_text),
            Paragraph("No active early warnings. Project is on schedule.", normal_text),
            Paragraph("Monitoring Unit", normal_text)
        ])

    t_alerts = Table(alert_rows, colWidths=[1.0 * inch, 1.6 * inch, 3.5 * inch, 1.4 * inch])
    t_alerts.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#EEF2F6')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#94A3B8')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(t_alerts)
    elements.append(Spacer(1, 12))

    # 6. Metadata & Footer
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94A3B8'), spaceAfter=6))
    elements.append(Paragraph(
        f"Generated by Project Drishti on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')} | "
        f"Model Version: {latest_pred.model_version if latest_pred else 'v1.0'} | "
        f"Dataset: demo-synthetic-v1",
        normal_text
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
