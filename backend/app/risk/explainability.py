"""
Explainability Engine for Project Drishti
Transforms analytical signals and model outputs into transparent, evidence-based risk drivers.
"Never simply display: 'AI says high risk.' Explain the evidence."
"""
from typing import Dict, Any, List

def generate_risk_drivers(
    features: Dict[str, float],
    sub_risks: Dict[str, float],
    policy: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """
    Generates structured risk drivers explaining the evidence behind high scores.
    """
    drivers = []

    # 1. Milestone Delay Signal
    delay_rate = features.get("milestone_delay_rate", 0.0)
    crit_count = int(features.get("critical_delayed_count", 0))
    del_count = int(features.get("delayed_milestone_count", 0))
    if del_count > 0 or delay_rate > 20:
        contrib = round(sub_risks.get("milestone_risk", 0.0) * policy.get("milestone_weight", 0.15), 1)
        evidence_str = f"{del_count} milestone(s) delayed ({crit_count} critical) with a delay rate of {delay_rate:.1f}%."
        drivers.append({
            "driver": "Milestone Slippage",
            "contribution": contrib,
            "evidence": evidence_str,
            "trend": "Increasing" if crit_count > 0 else "Stable"
        })

    # 2. Spend vs Physical Progress Divergence
    prog_gap = features.get("progress_gap", 0.0)
    fin_prog = features.get("financial_progress", 0.0)
    phy_prog = features.get("physical_progress", 0.0)
    if prog_gap > 10.0:
        contrib = round(min(25.0, prog_gap * 0.8), 1)
        evidence_str = (
            f"Financial expenditure ({fin_prog:.1f}%) is materially ahead of "
            f"physical completion ({phy_prog:.1f}%), a divergence of +{prog_gap:.1f}%."
        )
        drivers.append({
            "driver": "Spend/Progress Divergence",
            "contribution": contrib,
            "evidence": evidence_str,
            "trend": "Increasing"
        })

    # 3. Schedule Slippage
    sched_prog = features.get("schedule_progress", 0.0)
    sched_gap = sched_prog - phy_prog
    slippage_days = features.get("slippage_days", 0.0)
    if sched_gap > 8.0:
        contrib = round(sub_risks.get("time_risk", 0.0) * policy.get("time_weight", 0.30) * 0.7, 1)
        evidence_str = (
            f"Planned timeline ({sched_prog:.1f}%) exceeds physical achievement "
            f"({phy_prog:.1f}%) by {sched_gap:.1f}%, representing ~{slippage_days:.0f} slippage days."
        )
        drivers.append({
            "driver": "Schedule Slippage",
            "contribution": contrib,
            "evidence": evidence_str,
            "trend": "Increasing"
        })

    # 4. Progress Stagnation
    slope = features.get("progress_slope_3m", 0.0)
    delta = features.get("progress_delta", 0.0)
    if delta < 1.0 or slope < 1.0:
        contrib = round(sub_risks.get("progress_risk", 0.0) * policy.get("progress_weight", 0.15), 1)
        evidence_str = (
            f"Monthly physical progress increased by only {delta:.1f}%, with a "
            f"3-month velocity slope of {slope:.2f}% per month."
        )
        drivers.append({
            "driver": "Physical Progress Stagnation",
            "contribution": contrib,
            "evidence": evidence_str,
            "trend": "Stable" if delta > 0 else "Increasing"
        })

    # 5. Cost Escalation / Revision
    rev_app_ratio = features.get("revised_approved_ratio", 1.0)
    if rev_app_ratio > 1.05:
        contrib = round(sub_risks.get("cost_risk", 0.0) * policy.get("cost_weight", 0.30) * 0.6, 1)
        overrun_pct = (rev_app_ratio - 1.0) * 100.0
        evidence_str = f"Revised project cost is {overrun_pct:.1f}% above initial approved budget."
        drivers.append({
            "driver": "Budget Revision Escalation",
            "contribution": contrib,
            "evidence": evidence_str,
            "trend": "Increasing"
        })

    # 6. Data Staleness / Reporting Quality
    age_days = features.get("data_update_age", 15.0)
    if age_days > 45:
        contrib = round(sub_risks.get("data_quality_risk", 0.0) * policy.get("data_quality_weight", 0.10), 1)
        evidence_str = f"Last reported snapshot was {int(age_days)} days ago, exceeding timely monitoring frequency."
        drivers.append({
            "driver": "Reporting Inactivity",
            "contribution": contrib,
            "evidence": evidence_str,
            "trend": "Increasing"
        })

    # Sort drivers descending by contribution
    drivers.sort(key=lambda d: d["contribution"], reverse=True)
    
    # If no major driver triggered but overall score has values, provide baseline indicator
    if not drivers:
        drivers.append({
            "driver": "Baseline Variance",
            "contribution": 5.0,
            "evidence": "Project indicators remain within expected standard operational tolerances.",
            "trend": "Stable"
        })

    return drivers
