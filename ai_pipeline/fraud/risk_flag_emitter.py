"""
Risk Flag Emitter
Utility module for building structured risk flag dicts consistently.
Centralises the flag schema so all pipeline components emit the same format.
"""
from typing import Literal

Severity = Literal["low", "medium", "high"]


def emit(
    code: str,
    severity: Severity,
    description: str,
    recommended_action: str,
) -> dict:
    """
    Build a structured risk flag dict.

    Parameters
    ----------
    code : str
        Snake_case identifier (e.g. 'inventory_footfall_mismatch').
    severity : 'low' | 'medium' | 'high'
        Impact level for NBFC officer workflow routing.
    description : str
        Human-readable explanation of what the flag means.
    recommended_action : str
        Specific action the officer should take.

    Returns
    -------
    dict matching the RiskFlag Pydantic schema.
    """
    return {
        "code": code,
        "severity": severity,
        "description": description,
        "recommended_action": recommended_action,
    }


# ── Pre-defined standard flags ────────────────────────────────────────────────

INVENTORY_FOOTFALL_MISMATCH = emit(
    code="inventory_footfall_mismatch",
    severity="high",
    description=(
        "High inventory density detected but geo footfall score is very low — "
        "possible borrowed stock for inspection day."
    ),
    recommended_action="Conduct a physical visit to verify actual live inventory.",
)

LOW_IMAGE_CONSISTENCY = emit(
    code="low_image_consistency",
    severity="high",
    description=(
        "Significant variance in shelf density across uploaded images — "
        "suggests selective photography hiding low-stock areas."
    ),
    recommended_action="Request a fresh complete set of images from all angles.",
)

INSUFFICIENT_IMAGE_COVERAGE = emit(
    code="insufficient_image_coverage",
    severity="medium",
    description="Images do not cover all required views: interior, counter, and exterior.",
    recommended_action="Request the missing image types before proceeding.",
)

SKU_GEO_INCOME_MISMATCH = emit(
    code="sku_geo_income_mismatch",
    severity="medium",
    description=(
        "Premium product categories detected in a low-income catchment zone — "
        "display stock may not reflect actual sales."
    ),
    recommended_action="Verify product authenticity and request recent purchase invoices.",
)

HIGH_COMPETITION_LOW_SDI = emit(
    code="high_competition_low_sdi",
    severity="low",
    description=(
        "Dense competitor presence nearby combined with low shelf density — "
        "market share and margins may be under significant pressure."
    ),
    recommended_action="Reduce loan sizing. Consider field visit to assess competitive dynamics.",
)

TEMPORAL_RESTOCKING = emit(
    code="temporal_restocking_flag",
    severity="high",
    description=(
        "Shelf density rose monotonically across the video — "
        "shelves may have been stocked during filming to inflate the estimate."
    ),
    recommended_action="Request a new unannounced video or schedule a physical visit.",
)