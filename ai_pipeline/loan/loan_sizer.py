"""
Loan Sizer
Converts estimated monthly net income into a FOIR-based loan recommendation.

Formula (per KiranaIQ Implementation Bible):
  Max_Loan = Monthly_Net_Income × FOIR × Loan_Tenure_Months

Where:
  FOIR  = 0.45  (Fixed Obligation to Income Ratio — kirana industry standard)
  Tenure = 12–36 months, defaulting to 18 for first-time borrowers
  Rate   = 18% p.a. (typical NBFC rate for micro-business loans)

Output loan amounts are rounded to the nearest ₹5,000.
"""
import math


class LoanSizer:
    FOIR = 0.45
    INTEREST_RATE_PA = 0.18
    DEFAULT_TENURE_MONTHS = 18

    # Caps to prevent absurd recommendations
    MIN_LOAN = 50_000
    MAX_LOAN_CAP = 2_000_000  # ₹20L ceiling

    def size(self, monthly_income_range: tuple) -> dict:
        """
        Parameters
        ----------
        monthly_income_range : (int, int)
            (min_monthly_income, max_monthly_income) in ₹

        Returns
        -------
        dict with loan sizing recommendation
        """
        income_low, income_high = monthly_income_range

        # Monthly repayment capacity = income × FOIR
        emi_low  = income_low  * self.FOIR
        emi_high = income_high * self.FOIR

        # Principal = EMI × tenure (simplified; ignores interest for sizing)
        # A more precise formula: P = EMI × [1 - (1+r)^-n] / r
        r = self.INTEREST_RATE_PA / 12  # monthly interest rate
        n = self.DEFAULT_TENURE_MONTHS
        annuity_factor = (1 - (1 + r) ** -n) / r

        principal_low  = emi_low  * annuity_factor
        principal_high = emi_high * annuity_factor

        # Clamp and round to nearest ₹5,000
        min_loan = max(
            self.MIN_LOAN,
            self._round_to(principal_low, 5000)
        )
        max_loan = min(
            self.MAX_LOAN_CAP,
            self._round_to(principal_high, 5000)
        )

        # Ensure ordering
        if min_loan > max_loan:
            min_loan, max_loan = max_loan, min_loan

        return {
            "min_loan":                int(min_loan),
            "max_loan":                int(max_loan),
            "suggested_tenure_months": self.DEFAULT_TENURE_MONTHS,
            "monthly_emi_range":       (int(emi_low), int(emi_high)),
            "foir_used":               self.FOIR,
            "interest_rate_pa":        self.INTEREST_RATE_PA,
        }

    @staticmethod
    def _round_to(value: float, nearest: int) -> int:
        return int(round(value / nearest) * nearest)