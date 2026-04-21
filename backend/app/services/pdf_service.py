"""
PDF Credit Memo Service
Generates a structured one-page credit memo using ReportLab.
The client-side jsPDF export (exportPDF.ts) is a convenience fallback;
this server-side version is the authoritative /assess/{id}/pdf endpoint.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.platypus.flowables import KeepTogether
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from datetime import datetime, timezone
import io

# ── Brand palette ─────────────────────────────────────────────────────────────
ORANGE   = colors.HexColor("#FF6B35")
DARK     = colors.HexColor("#0D0D0D")
MUTED    = colors.HexColor("#7A7670")
BORDER   = colors.HexColor("#E4E2DD")
SUCCESS  = colors.HexColor("#1A7A4A")
WARNING  = colors.HexColor("#B45309")
DANGER   = colors.HexColor("#DC2626")
SURFACE  = colors.HexColor("#F2F1EE")


def _inr(amount: int | float) -> str:
    return f"\u20b9{int(amount):,}"


def _inr_range(lo: int | float, hi: int | float) -> str:
    return f"{_inr(lo)} \u2013 {_inr(hi)}"


def _sev_color(sev: str) -> colors.Color:
    return {"high": DANGER, "medium": WARNING, "low": MUTED}.get(sev, MUTED)


def _rec_color(rec: str) -> colors.Color:
    return {"approve": SUCCESS, "needs_verification": WARNING, "reject": DANGER}.get(rec, MUTED)


def _rec_label(rec: str) -> str:
    return {"approve": "APPROVE", "needs_verification": "NEEDS VERIFICATION", "reject": "REJECT"}.get(
        rec, rec.upper().replace("_", " ")
    )


def _rec_bg(rec: str) -> colors.Color:
    return {
        "approve": colors.HexColor("#ECFDF3"),
        "needs_verification": colors.HexColor("#FFFBEB"),
        "reject": colors.HexColor("#FEF2F2"),
    }.get(rec, SURFACE)


def _color_hex(c: colors.Color) -> str:
    """Safe hex extraction that works across ReportLab versions."""
    try:
        # ReportLab >= 3.x
        return c.hexval()[1:]  # strip leading '#'
    except AttributeError:
        try:
            # Fallback: use rgb values
            r = int(c.red * 255)
            g = int(c.green * 255)
            b = int(c.blue * 255)
            return f"{r:02x}{g:02x}{b:02x}"
        except Exception:
            return "000000"


def generate_credit_memo(doc: dict) -> bytes:
    """
    Generate a PDF credit memo from a completed assessment MongoDB document.
    Returns raw PDF bytes, ready to be streamed as application/pdf.
    """
    buf = io.BytesIO()
    pdf = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=1.8 * cm, bottomMargin=1.8 * cm,
        title=f"KiranaIQ Memo – {(doc.get('assessment_id') or '')[:8].upper()}",
    )

    styles = getSampleStyleSheet()

    def style(name, **kw):
        base = kw.pop("parent", styles["Normal"])
        return ParagraphStyle(name, parent=base, **kw)

    H1   = style("H1", fontName="Helvetica-Bold", fontSize=18, textColor=DARK, spaceAfter=2)
    SECT = style("SECT", fontName="Helvetica-Bold", fontSize=11, textColor=DARK, spaceBefore=10, spaceAfter=4)
    BODY = style("BODY", fontName="Helvetica", fontSize=9, textColor=DARK, leading=13)
    TINY = style("TINY", fontName="Helvetica", fontSize=8, textColor=MUTED, leading=11)
    DISC = style("DISC", fontName="Helvetica-Oblique", fontSize=7.5, textColor=MUTED, leading=11)
    RIGH = style("RIGH", fontName="Helvetica", fontSize=8, textColor=MUTED, alignment=TA_RIGHT)
    CENT = style("CENT", fontName="Helvetica-Bold", fontSize=13, alignment=TA_CENTER)

    story = []
    short_id = (doc.get("assessment_id") or "N/A")[:8].upper()
    generated = datetime.now(timezone.utc).strftime("%d %B %Y, %H:%M UTC")

    # ── Header ────────────────────────────────────────────────────────────────
    hdr = Table(
        [[Paragraph("KiranaIQ — Credit Assessment Memo", H1),
          Paragraph(f"ID: {short_id}<br/>Generated: {generated}", RIGH)]],
        colWidths=["60%", "40%"],
    )
    hdr.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]))
    story.append(hdr)
    story.append(HRFlowable(width="100%", thickness=2, color=ORANGE, spaceAfter=8))

    # ── Store metadata ────────────────────────────────────────────────────────
    rows = [["Store Address", doc.get("store_address") or "Not provided"]]
    lat, lng = doc.get("lat", 0), doc.get("lng", 0)
    rows.append(["GPS Coordinates", f"{lat:.5f}, {lng:.5f}"])
    if doc.get("shop_size_sqft"):
        rows.append(["Shop Size", f"{int(doc['shop_size_sqft'])} sq ft"])
    if doc.get("years_in_operation") is not None:
        rows.append(["Years in Operation", str(doc["years_in_operation"])])
    if doc.get("monthly_rent"):
        rows.append(["Monthly Rent", _inr(doc["monthly_rent"])])

    meta = Table(
        [[Paragraph(k, TINY), Paragraph(str(v), BODY)] for k, v in rows],
        colWidths=["28%", "72%"],
    )
    meta.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
        ("BACKGROUND", (0, 0), (0, -1), SURFACE),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
    ]))
    story.append(meta)
    story.append(Spacer(1, 10))

    # ── Recommendation banner ─────────────────────────────────────────────────
    rec = doc.get("recommendation", "needs_verification")
    conf_pct = f"{int((doc.get('confidence_score') or 0) * 100)}%"
    rec_c = _rec_color(rec)
    rec_hex = _color_hex(rec_c)

    banner = Table(
        [[Paragraph(f'<font color="#{rec_hex}">{_rec_label(rec)}</font>', CENT),
          Paragraph(f"Confidence Score<br/><font size='18'><b>{conf_pct}</b></font>",
                    style("CC", fontName="Helvetica", fontSize=9, textColor=MUTED, alignment=TA_CENTER, leading=18))]],
        colWidths=["50%", "50%"],
    )
    banner.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1.5, rec_c),
        ("BACKGROUND", (0, 0), (-1, -1), _rec_bg(rec)),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(banner)
    story.append(Spacer(1, 10))

    # ── Cash Flow Estimates ───────────────────────────────────────────────────
    story.append(Paragraph("Cash Flow Estimates", SECT))
    cash_rows = [["Metric", "Estimated Range"]]
    for label, key in [
        ("Daily Sales Range", "daily_sales_range"),
        ("Monthly Revenue Range", "monthly_revenue_range"),
        ("Monthly Net Income Range", "monthly_income_range"),
    ]:
        val = doc.get(key)
        if val and len(val) == 2:
            cash_rows.append([label, _inr_range(*val)])

    cash = Table(cash_rows, colWidths=["45%", "55%"])
    cash.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 1), (-1, -1), 0.3, BORDER),
        ("BACKGROUND", (0, 1), (0, -1), SURFACE),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(cash)
    story.append(Spacer(1, 10))

    # ── Key Signals ───────────────────────────────────────────────────────────
    story.append(Paragraph("Key Signals", SECT))
    sig_rows = [["Signal", "Value", "Direction"]]
    sig_specs = [
        ("Shelf Density Index", "shelf_density_index", "{:.0%}", "Positive"),
        ("SKU Diversity Score", "sku_diversity_score", "{}/10", "Positive"),
        ("Geo Footfall Score", "geo_footfall_score", "{:.0f}/100", "Positive"),
        ("Competition Index", "competition_index", "{:.0%}", "Compresses"),
    ]
    for label, key, fmt, direction in sig_specs:
        v = doc.get(key)
        if v is not None:
            try:
                fmted = fmt.format(v)
            except Exception:
                fmted = str(v)
            sig_rows.append([label, fmted, f"▲ {direction}" if "Positive" in direction else f"▼ {direction}"])

    sig = Table(sig_rows, colWidths=["42%", "28%", "30%"])
    sig.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 1), (-1, -1), 0.3, BORDER),
        ("BACKGROUND", (0, 1), (0, -1), SURFACE),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(sig)
    story.append(Spacer(1, 10))

    # ── Loan Recommendation ───────────────────────────────────────────────────
    loan = doc.get("loan_suggestion")
    if loan:
        story.append(Paragraph("Loan Recommendation", SECT))
        # monthly_emi_range can be a tuple or list — normalize
        emi = list(loan.get("monthly_emi_range", [0, 0]))
        loan_rows = [
            ["Suggested Loan Range", _inr_range(loan["min_loan"], loan["max_loan"])],
            ["Tenure", f"{loan.get('suggested_tenure_months', 18)} months"],
            ["Monthly EMI Range", _inr_range(*emi) if len(emi) == 2 else "N/A"],
            ["FOIR Applied", f"{loan.get('foir_used', 0.45) * 100:.0f}% (industry standard)"],
            ["Interest Rate", f"{loan.get('interest_rate_pa', 0.18) * 100:.0f}% p.a."],
        ]
        lt = Table(loan_rows, colWidths=["40%", "60%"])
        lt.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.3, BORDER),
            ("BACKGROUND", (0, 0), (0, -1), SURFACE),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
        ]))
        story.append(KeepTogether(lt))
        story.append(Spacer(1, 10))

    # ── Risk Flags ────────────────────────────────────────────────────────────
    story.append(Paragraph("Risk Flags", SECT))
    flags = doc.get("risk_flags", [])
    if not flags:
        story.append(Paragraph(
            "\u2713  No risk flags — all 5 cross-signal tripwires passed.",
            style("OK", fontName="Helvetica", fontSize=9, textColor=SUCCESS),
        ))
    else:
        for flag in flags:
            sev = flag.get("severity", "medium")
            sc = _sev_color(sev)
            sc_hex = _color_hex(sc)
            ft = Table(
                [
                    [Paragraph(f'<font color="#{sc_hex}"><b>[{sev.upper()}]</b></font> '
                               f'{flag.get("code", "").replace("_", " ").title()}', BODY)],
                    [Paragraph(flag.get("description", ""), TINY)],
                    [Paragraph(f'<b>Action:</b> {flag.get("recommended_action", "")}', TINY)],
                ],
                colWidths=["100%"],
            )
            ft.setStyle(TableStyle([
                ("BOX", (0, 0), (-1, -1), 0.5, sc),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFDF9")),
            ]))
            story.append(KeepTogether(ft))
            story.append(Spacer(1, 5))

    # ── Peer Benchmark ────────────────────────────────────────────────────────
    peer = doc.get("peer_benchmark")
    if peer and peer.get("n_peers", 0) > 0:
        story.append(Paragraph("Peer Benchmark", SECT))
        story.append(Paragraph(
            f"<b>{peer['percentile']:.0f}th percentile</b> among {peer['n_peers']} comparable "
            f"stores within 2 km. Peer avg SDI: {peer['avg_sdi']:.2f} | "
            f"Peer avg footfall: {peer['avg_footfall']:.0f}.",
            BODY,
        ))
        story.append(Spacer(1, 8))

    # ── Pipeline summary ──────────────────────────────────────────────────────
    stages = doc.get("pipeline_stages", [])
    if stages:
        done = [s["stage"].title() for s in stages if s.get("status") == "done"]
        if done:
            story.append(Paragraph(f"Pipeline completed: {' \u00b7 '.join(done)}", TINY))
        story.append(Spacer(1, 6))

    # ── Disclaimer ────────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER, spaceBefore=4, spaceAfter=5))
    story.append(Paragraph(
        "This report is generated by the KiranaIQ AI underwriting engine for informational purposes only. "
        "Revenue estimates carry inherent uncertainty as reflected in the confidence score. Lenders must "
        "conduct independent due diligence, including physical store visits where risk flags are present, "
        "before making any credit decisions. KiranaIQ outputs do not constitute a credit bureau report or "
        "a financial audit.",
        DISC,
    ))

    pdf.build(story)
    return buf.getvalue()