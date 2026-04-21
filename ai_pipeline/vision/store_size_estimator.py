"""
Store Size Estimator
Visual floor-area estimation from a store image.
Uses Groq Vision to classify store size and then maps to a square-foot estimate.

Called by MultiImageMerger to augment the store_area field with a numeric estimate
that can boost the sales estimator (Path C: revenue per sq ft).
"""

SIZE_SQFT_MAP = {
    "small":  75,    # < 100 sqft  — tiny paan-shop style
    "medium": 175,   # 100–300 sqft — typical urban kirana
    "large":  400,   # > 300 sqft  — large neighbourhood store
}

# If Groq vision gives us a numeric estimate, use it directly.
# Otherwise fall back to the text label mapping above.


class StoreSizeEstimator:
    def estimate_from_vision(self, store_area_label: str, sqft_hint: float | None = None) -> dict:
        """
        Parameters
        ----------
        store_area_label : str
            Text label from Groq Vision ("small" | "medium" | "large").
        sqft_hint : float | None
            If the field officer provided shop_size_sqft, use it directly.

        Returns
        -------
        dict with:
            estimated_sqft : float
            size_label     : str
            source         : "officer_input" | "vision_estimate"
        """
        if sqft_hint and sqft_hint > 0:
            # Officer-provided value is ground truth
            label = "small" if sqft_hint < 100 else "large" if sqft_hint > 300 else "medium"
            return {
                "estimated_sqft": float(sqft_hint),
                "size_label": label,
                "source": "officer_input",
            }

        label = (store_area_label or "medium").lower()
        if label not in SIZE_SQFT_MAP:
            label = "medium"

        return {
            "estimated_sqft": float(SIZE_SQFT_MAP[label]),
            "size_label": label,
            "source": "vision_estimate",
        }

    def area_multiplier(self, store_area_label: str) -> float:
        """
        Simple multiplier used in ProductDetector.
        small=0.7, medium=1.0, large=1.5
        """
        return {"small": 0.7, "medium": 1.0, "large": 1.5}.get(
            (store_area_label or "medium").lower(), 1.0
        )