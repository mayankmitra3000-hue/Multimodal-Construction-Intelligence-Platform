"""Deterministic demo responses used when no Gemini key is configured.

The data is intentionally plausible and internally consistent so the product can be
demoed end-to-end without network access or API spend.
"""

from __future__ import annotations

import hashlib
import re
from datetime import date, timedelta
from typing import Any, Iterable

from ..schemas.daily import DailyRequest
from ..schemas.planning import PlanningRequest
from ..schemas.valuation import ValuationRequest
from ..schemas.weather import WeatherRequest


def _seed(*parts: str) -> int:
    digest = hashlib.sha256("|".join(parts).encode("utf-8")).digest()
    return int.from_bytes(digest[:8], "big")


def _pick(seed: int, options: Iterable[Any], offset: int = 0) -> Any:
    items = list(options)
    return items[(seed + offset) % len(items)]


def _sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?])\s+|\n+", text.strip())
    return [p.strip(" -•\t") for p in parts if len(p.strip(" -•\t")) > 3]


def _money_range(value: float, spread: float, currency: str = "USD") -> dict[str, Any]:
    low = max(0.0, value * (1 - spread))
    high = value * (1 + spread)
    return {
        "min": round(low, 2),
        "max": round(high, 2),
        "currency": currency.upper(),
    }


# --------------------------------------------------------------------------- safety


def safety(notes: str | None) -> dict[str, Any]:
    seed = _seed("safety", notes or "")
    workers = 2 + seed % 7
    compliance = 58 + seed % 34
    timestamp = "14:32"

    catalog = [
        {
            "title": "Unprotected edge at elevated slab",
            "category": "Fall protection",
            "severity": "critical",
            "description": "Open slab edge without guardrail or fall-arrest coverage near an active work zone.",
            "location": "Level 2 east edge",
            "evidence": "Worker positioned within 1.5 m of an unguarded edge; no anchor line visible.",
            "recommendation": "Stop work in the zone, install rated guardrails or nets, and verify anchor points before restarting.",
        },
        {
            "title": "Missing high-visibility vest",
            "category": "PPE",
            "severity": "medium",
            "description": "One operative lacks a Class 2 high-visibility vest in a plant operating area.",
            "location": "Material laydown yard",
            "evidence": "Dark clothing visible on the operative directing the telehandler.",
            "recommendation": "Issue a compliant vest and brief the crew on the site PPE standard at the next toolbox talk.",
        },
        {
            "title": "Poor housekeeping around access route",
            "category": "Housekeeping",
            "severity": "medium",
            "description": "Offcuts and loose rebar obstruct the primary pedestrian route.",
            "location": "Ground floor access corridor",
            "evidence": "Debris spans more than half the walkway width.",
            "recommendation": "Clear the route, provide dedicated waste bins, and add daily housekeeping to the supervisor checklist.",
        },
        {
            "title": "Unsecured ladder access",
            "category": "Access",
            "severity": "high",
            "description": "Ladder is not tied off and extends inadequately above the landing.",
            "location": "West stair core",
            "evidence": "Ladder base unsecured and top extension below the required handhold.",
            "recommendation": "Remove the ladder from service or secure it, restore the 1 m extension, and provide a second access point.",
        },
        {
            "title": "Exposed temporary electrical cable",
            "category": "Electrical",
            "severity": "high",
            "description": "Damaged insulation on a temporary distribution cable crossing a wet area.",
            "location": "Basement pump area",
            "evidence": "Visible conductor exposure and water pooling beneath the cable run.",
            "recommendation": "Isolate the circuit, replace the cable, and route it overhead with RCD protection verified.",
        },
        {
            "title": "Unstable material stacking",
            "category": "Materials",
            "severity": "medium",
            "description": "Block pallets stacked above safe height without racking or banding.",
            "location": "Storage zone B",
            "evidence": "Stack height exceeds two pallets and is leaning toward the walkway.",
            "recommendation": "Break down the stack, use racking, and mark a no-access zone around storage.",
        },
    ]

    count = 3 + seed % 2
    hazards = []
    for index in range(count):
        item = catalog[(seed // 7 + index) % len(catalog)]
        hazards.append({"id": f"H-{index + 1:02d}", **item})

    severity_rank = {"low": 1, "medium": 2, "high": 3, "critical": 4}
    overall = max(hazards, key=lambda h: severity_rank[h["severity"]])["severity"]

    def ppe(name: str, offset: int) -> dict[str, Any]:
        roll = (seed + offset) % 100
        if compliance >= 80:
            status = "detected" if roll > 15 else "not_detected"
        else:
            status = "detected" if roll > 45 else "not_detected"
        if name == "Safety harness" and "critical" not in overall:
            status = "unclear"
        return {
            "name": name,
            "status": status,
            "confidence": round(0.62 + (roll % 25) / 100, 2),
        }

    ppe_items = [
        ppe("Safety helmet", 1),
        ppe("High-visibility vest", 2),
        ppe("Safety harness", 3),
        ppe("Eye protection", 4),
        ppe("Gloves", 5),
        ppe("Safety footwear", 6),
    ]

    immediate = [h["recommendation"] for h in hazards if h["severity"] in {"high", "critical"}]
    if not immediate:
        immediate = ["Maintain the current controls and continue hourly supervisor checks."]

    return {
        "overall_risk": overall,
        "summary": (
            f"Site walk at {timestamp} found {workers} workers active and {count} notable "
            f"hazards. PPE compliance is estimated at {compliance}%. The controlling risk "
            f"is '{hazards[0]['title'].lower()}'. Correct high-severity items before the "
            "next shift."
        ),
        "workers_detected": workers,
        "hazards": hazards,
        "ppe_items": ppe_items,
        "compliance_score": compliance,
        "immediate_actions": immediate,
        "recommendations": [
            "Run a targeted toolbox talk covering the top two hazards at shift start.",
            "Assign a supervisor to verify corrective actions and photograph close-out.",
            "Review the permit-to-work controls for elevated and electrical activities.",
            "Increase housekeeping checks to twice per shift in active work zones.",
        ],
        "confidence": {
            "score": 0.64,
            "rationale": "Deterministic demo estimate; live visual confidence requires a Gemini key.",
        },
    }


# --------------------------------------------------------------------------- cracks


def cracks(notes: str | None) -> dict[str, Any]:
    lowered = (notes or "").lower()
    negative = any(
        phrase in lowered
        for phrase in ("no crack", "no visible crack", "no defect", "sound concrete")
    )
    seed = _seed("crack", notes or "")
    detected = not negative

    if not detected:
        return {
            "crack_detected": False,
            "crack_type": None,
            "severity": "low",
            "severity_score": 0,
            "dimensions": {"length_cm": None, "width_mm": None, "estimated_depth_mm": None},
            "location": "Inspected surface",
            "probable_cause": "No crack or distress pattern visible in the supplied view.",
            "structural_assessment": (
                "No actionable cracking identified. Continue routine inspection and document "
                "the surface condition for future comparison."
            ),
            "urgency": "monitor",
            "repair_options": [],
            "estimated_repair_cost": {"min": 0, "max": 0, "currency": "USD"},
            "monitoring_plan": [
                "Re-inspect at the next scheduled walk and compare photographs.",
                "Record any new staining, efflorescence, or width change.",
            ],
            "recommendations": [
                "Retain a dated photo with a scale reference for the baseline record."
            ],
            "confidence": {
                "score": 0.71,
                "rationale": "Demo heuristic produced a no-crack result from the inspector notes.",
            },
        }

    crack_type = _pick(
        seed,
        ["flexural", "settlement", "thermal", "shear", "shrinkage", "corrosion"],
    )
    width_mm = round(0.2 + (seed % 90) / 10, 1)
    length_cm = float(30 + seed % 370)
    depth_mm = round(width_mm * (4 + seed % 5), 1)

    if width_mm < 0.3:
        severity, score, urgency = "low", 22 + seed % 12, "monitor"
    elif width_mm < 1.0:
        severity, score, urgency = "medium", 45 + seed % 15, "schedule"
    elif width_mm < 2.5:
        severity, score, urgency = "high", 70 + seed % 12, "urgent"
    else:
        severity, score, urgency = "critical", 86 + seed % 10, "immediate"

    causes = {
        "flexural": "Tension overstress from loading or insufficient reinforcement in the span.",
        "settlement": "Differential foundation movement beneath the affected element.",
        "thermal": "Restrained thermal movement across a large concrete pour.",
        "shear": "High shear demand near a support with inadequate stirrup detailing.",
        "shrinkage": "Plastic or drying shrinkage restrained by adjacent elements.",
        "corrosion": "Reinforcement corrosion and expansive rust jacking at cover depth.",
    }
    repair_matrix = {
        "low": [
            ("Surface sealing", "Clean and apply a flexible crack sealant to limit moisture ingress.", 450, 900, 8),
            ("Monitoring", "Install crack width gauges and record movement fortnightly.", 150, 350, None),
        ],
        "medium": [
            ("Epoxy injection", "Pressure-inject low-viscosity epoxy to restore monolithic action.", 1200, 2400, 20),
            ("Routing and sealing", "Route and seal the crack where movement is expected.", 700, 1500, 10),
        ],
        "high": [
            ("Structural epoxy injection", "Engineer-specified injection with cover repair and verification.", 3500, 7000, 25),
            ("Carbon-fibre strengthening", "Add flexural strengthening if the section is under-capacity.", 8000, 18000, 30),
        ],
        "critical": [
            ("Emergency shoring and assessment", "Prop the element and isolate the area pending engineer review.", 6000, 15000, 5),
            ("Section replacement", "Remove and reconstruct the affected zone under engineered design.", 18000, 45000, 40),
        ],
    }

    low_cost = 0.0
    high_cost = 0.0
    repair_options = []
    for method, desc, cost_low, cost_high, life in repair_matrix[severity]:
        low_cost += cost_low
        high_cost += cost_high
        repair_options.append(
            {
                "method": method,
                "description": desc,
                "estimated_cost": {
                    "min": float(cost_low),
                    "max": float(cost_high),
                    "currency": "USD",
                },
                "lifespan_years": life,
            }
        )

    return {
        "crack_detected": True,
        "crack_type": crack_type,
        "severity": severity,
        "severity_score": min(score, 99),
        "dimensions": {
            "length_cm": length_cm,
            "width_mm": width_mm,
            "estimated_depth_mm": depth_mm,
        },
        "location": _pick(seed, ["Soffit of suspended slab", "Basement retaining wall", "External column face", "Ground-floor slab near joint"]),
        "probable_cause": causes[crack_type],
        "structural_assessment": (
            f"A {width_mm} mm wide, {crack_type} crack pattern suggests {causes[crack_type].lower()} "
            f"At the observed width the defect is classified {severity}. "
            "Confirm geometry and reinforcement with a licensed structural engineer before "
            "structural repair."
        ),
        "urgency": urgency,
        "repair_options": repair_options,
        "estimated_repair_cost": {
            "min": round(low_cost, 2),
            "max": round(high_cost, 2),
            "currency": "USD",
        },
        "monitoring_plan": [
            "Install two crack-width gauges: one at the widest point and one at the terminus.",
            "Photograph with a scale reference weekly for four weeks.",
            "Measure and record width on the same datum each time.",
        ],
        "recommendations": [
            "Restrict live loads near the affected element until reviewed.",
            "Engage a structural engineer if width grows by more than 0.3 mm.",
            "Check for water ingress and repair any associated drainage defect.",
        ],
        "confidence": {
            "score": 0.61,
            "rationale": "Demo heuristic using notes only; a keyed Gemini vision pass is required for image evidence.",
        },
    }


# --------------------------------------------------------------------------- valuation

_BASE_PSM_USD = {
    "apartment": 1850.0,
    "house": 1600.0,
    "villa": 2450.0,
    "commercial": 2200.0,
    "industrial": 900.0,
    "land": 420.0,
}

_CONDITION_MULT = {
    "excellent": 1.18,
    "good": 1.06,
    "fair": 0.94,
    "poor": 0.78,
}

_FX_FROM_USD = {
    "USD": 1.0,
    "EUR": 0.92,
    "GBP": 0.79,
    "AED": 3.67,
    "SAR": 3.75,
    "INR": 83.0,
    "NGN": 1500.0,
    "ZAR": 18.5,
    "CAD": 1.36,
    "AUD": 1.52,
}


def valuation(request: ValuationRequest) -> dict[str, Any]:
    seed = _seed("valuation", request.location.lower(), request.property_type)
    currency = request.currency.upper()
    fx = _FX_FROM_USD.get(currency, 1.0)

    base = _BASE_PSM_USD[request.property_type]
    condition = _CONDITION_MULT[request.condition]
    age_mult = max(0.7, 1 - request.age_years * 0.006)
    amenity_mult = min(1.15, 1 + 0.025 * len(request.amenities))

    lowered = request.location.lower()
    if any(word in lowered for word in ("downtown", "central", "prime", "metro", "city center")):
        location_mult = 1.28
    elif any(word in lowered for word in ("rural", "remote", "village")):
        location_mult = 0.84
    else:
        location_mult = 0.94 + (seed % 28) / 100

    if request.area_sqm < 60:
        size_mult = 1.08
    elif request.area_sqm > 500:
        size_mult = 0.93
    else:
        size_mult = 1.0

    psm_usd = base * condition * age_mult * amenity_mult * location_mult * size_mult
    psm_local = psm_usd * fx
    total = psm_local * request.area_sqm
    spread = 0.06 + (seed % 5) / 100

    outlook = _pick(seed, ["stable", "appreciating", "stable", "declining"])

    def factor(name: str, multiplier: float, explanation: str, weight: float) -> dict[str, Any]:
        impact = "positive" if multiplier > 1.01 else "negative" if multiplier < 0.99 else "neutral"
        return {
            "name": name,
            "impact": impact,
            "weight": round(weight, 2),
            "explanation": explanation,
        }

    factors = [
        factor(
            "Location",
            location_mult,
            f"Buyer demand and access in {request.location} imply a {location_mult:.0%} location adjustment.",
            0.3,
        ),
        factor(
            "Condition",
            condition,
            f"'{request.condition.title()}' condition applies a {condition:.0%} multiplier.",
            0.2,
        ),
        factor(
            "Age and depreciation",
            age_mult,
            f"{request.age_years} years of age results in an effective {age_mult:.0%} retention factor.",
            0.15,
        ),
        factor(
            "Amenities",
            amenity_mult,
            f"{len(request.amenities)} listed amenities add approximately {(amenity_mult - 1):.0%}.",
            0.15,
        ),
        factor(
            "Size efficiency",
            size_mult,
            "Unit size relative to local demand and per-square-metre efficiency.",
            0.1,
        ),
        factor(
            "Market momentum",
            1.0,
            f"Local segment is assessed as {outlook} over the next 6-12 months.",
            0.1,
        ),
    ]

    return {
        "estimated_value": {
            "min": round(total * (1 - spread), 2),
            "max": round(total * (1 + spread), 2),
            "currency": currency,
        },
        "price_per_sqm": {
            "min": round(psm_local * (1 - spread), 2),
            "max": round(psm_local * (1 + spread), 2),
            "currency": currency,
        },
        "confidence": {
            "score": 0.7,
            "rationale": "Deterministic hedonic-style demo model; live AI adds narrative and market context.",
        },
        "market_outlook": outlook,
        "valuation_factors": factors,
        "comparable_note": (
            f"Indicative comparison assumes {request.area_sqm:.0f} m² of {request.property_type} "
            f"space in {request.location}, adjusted for condition and age. Verify with three "
            "recent local transactions before relying on the range."
        ),
        "assumptions": [
            f"Values are expressed in {currency}; an indicative USD cross-rate was applied where needed.",
            "No title, encumbrance, zoning, or structural defects were considered.",
            "Amenities are assumed operational and compliant.",
        ],
        "recommendations": [
            "Commission a physical inspection and title check before transaction.",
            "Request three verified comparable sales within the last six months.",
            "Refine the range after confirming net lettable area and any service charges.",
        ],
    }


# --------------------------------------------------------------------------- planning

_PHASE_TEMPLATES = [
    (
        "Pre-construction & mobilization",
        0.10,
        [
            ("Permits and approvals", "Planning"),
            ("Mobilization and site setup", "General"),
            ("Long-lead procurement", "Procurement"),
        ],
    ),
    (
        "Site preparation & earthworks",
        0.10,
        [
            ("Clearing and setting out", "Earthworks"),
            ("Excavation and grading", "Earthworks"),
            ("Utilities and drainage trenching", "Civil"),
        ],
    ),
    (
        "Foundation & substructure",
        0.16,
        [
            ("Blinding and waterproofing", "Concrete"),
            ("Footings and raft construction", "Concrete"),
            ("Curing and backfill", "Concrete"),
        ],
    ),
    (
        "Superstructure",
        0.24,
        [
            ("Columns and shear walls", "Concrete"),
            ("Beam and slab cycles", "Concrete"),
            ("Stair and core construction", "Concrete"),
        ],
    ),
    (
        "Envelope & roofing",
        0.10,
        [
            ("Masonry and facade framing", "Envelope"),
            ("Roofing and waterproofing", "Roofing"),
            ("Windows and external doors", "Glazing"),
        ],
    ),
    (
        "MEP rough-in",
        0.12,
        [
            ("Electrical containment and cabling", "Electrical"),
            ("Plumbing and drainage rough-in", "Mechanical"),
            ("HVAC ductwork and equipment", "Mechanical"),
        ],
    ),
    (
        "Finishes & fit-out",
        0.13,
        [
            ("Screeds, plaster and painting", "Finishes"),
            ("Flooring and ceilings", "Finishes"),
            ("Joinery, fixtures and fittings", "Fit-out"),
        ],
    ),
    (
        "Testing, commissioning & handover",
        0.05,
        [
            ("MEP testing and commissioning", "Commissioning"),
            ("Snagging and defect rectification", "General"),
            ("Handover documentation and training", "General"),
        ],
    ),
]


def planning(request: PlanningRequest) -> dict[str, Any]:
    seed = _seed("planning", request.project_name, request.description[:120])
    target_days = (
        request.duration_weeks_target * 7
        if request.duration_weeks_target
        else 180
    )
    team_size = request.team_size or 24

    phases: list[dict[str, Any]] = []
    milestones: list[dict[str, Any]] = []
    critical_path: list[str] = []
    previous_last_task: str | None = None
    day_cursor = 1
    task_counter = 0

    for phase_index, (phase_name, weight, template) in enumerate(_PHASE_TEMPLATES):
        phase_days = max(len(template), round(target_days * weight))
        task_count = len(template)
        base_duration = max(1, phase_days // task_count)
        remainder = phase_days - base_duration * task_count
        phase_start = day_cursor
        tasks: list[dict[str, Any]] = []
        last_task_id: str | None = previous_last_task

        for task_index, (task_name, trade) in enumerate(template):
            duration = base_duration + (1 if task_index < remainder else 0)
            task_counter += 1
            task_id = f"T{task_counter:02d}"
            depends = [last_task_id] if last_task_id else []
            tasks.append(
                {
                    "id": task_id,
                    "name": task_name,
                    "duration_days": duration,
                    "depends_on": depends,
                    "trade": trade,
                    "crew_size": max(2, min(12, 3 + (seed + task_counter) % 8)),
                }
            )
            last_task_id = task_id
            day_cursor += duration

        previous_last_task = last_task_id
        if last_task_id:
            critical_path.append(last_task_id)

        phases.append(
            {
                "name": phase_name,
                "start_day": phase_start,
                "end_day": day_cursor - 1,
                "summary": (
                    f"{phase_name} runs for {phase_days} days across {task_count} sequenced "
                    f"tasks with {len(set(t[1] for t in template))} trade groups."
                ),
                "tasks": tasks,
            }
        )

        if phase_index in {2, 3, 5, 7}:
            milestone_name = {
                2: "Substructure complete",
                3: "Structure topped out",
                5: "MEP rough-in complete",
                7: "Practical completion",
            }[phase_index]
            milestones.append(
                {
                    "name": milestone_name,
                    "day": day_cursor - 1,
                    "deliverable": f"Signed inspection and close-out pack for {phase_name.lower()}.",
                }
            )

    budget_categories = [
        ("Preliminaries & site overheads", 8),
        ("Substructure", 15),
        ("Superstructure", 24),
        ("Envelope & roofing", 12),
        ("MEP systems", 18),
        ("Finishes & fit-out", 15),
        ("External works", 5),
        ("Contingency", 3),
    ]
    budget = request.budget
    budget_breakdown = [
        {
            "category": name,
            "percent": float(percent),
            "amount": round(budget * percent / 100, 2) if budget else None,
        }
        for name, percent in budget_categories
    ]

    roles = [
        ("Project Manager", 1),
        ("Site Engineer", max(1, team_size // 18)),
        ("Foreman", max(1, team_size // 14)),
        ("Safety Officer", 1),
        ("Skilled trades", max(4, round(team_size * 0.45))),
        ("General laborers", max(4, round(team_size * 0.3))),
    ]
    resource_plan = [
        {
            "role": role,
            "headcount": count,
            "allocation_weeks": round((day_cursor - 1) / 7 * (0.45 + 0.55 * count / max(1, team_size)), 1),
        }
        for role, count in roles
    ]

    risk_catalog = [
        ("Adverse weather interrupting external works", "high", "medium", "Track a reliable forecast and keep internal works as a float activity."),
        ("Long-lead equipment delivery slip", "medium", "high", "Place orders at mobilization and require weekly supplier status reports."),
        ("Permit approval delay", "medium", "high", "Submit packages early and maintain a dedicated approvals tracker."),
        ("Skilled labor shortage", "medium", "medium", "Pre-qualify two subcontractors per key trade and lock rates."),
        ("Design changes during construction", "high", "medium", "Freeze design packages 2 weeks before each phase and run a change board."),
        ("Cash-flow timing gap", "low", "high", "Align the payment schedule with the cost-loaded programme."),
    ]
    risks = [
        {"title": title, "probability": probability, "impact": impact, "mitigation": mitigation}
        for title, probability, impact, mitigation in risk_catalog[seed % 2 : seed % 2 + 4]
    ]

    total_days = day_cursor - 1
    budget_note = (
        f" with a {request.currency} {budget:,.0f} budget" if budget else ""
    )
    return {
        "summary": (
            f"'{request.project_name}' is planned as {len(phases)} sequential phases over "
            f"{total_days} days{budget_note}. The programme assumes conventional sequence, "
            f"a peak crew of about {team_size}, and standard permitting. Four principal risks "
            "are tracked with mitigations."
        ),
        "total_duration_days": total_days,
        "phases": phases,
        "milestones": milestones,
        "critical_path": critical_path,
        "resource_plan": resource_plan,
        "budget_breakdown": budget_breakdown,
        "risks": risks,
        "assumptions": [
            "Single shift, 6-day working week with weather allowances built into external phases.",
            "Permits are approved before mobilization and design is sufficiently complete to start.",
            "Budget excludes land acquisition, financing costs, and VAT unless stated.",
            "Durations are indicative and should be validated by the appointed contractors.",
        ],
    }


# --------------------------------------------------------------------------- daily


def daily(request: DailyRequest) -> dict[str, Any]:
    seed = _seed("daily", request.notes)
    sentences = _sentences(request.notes)
    lowered = request.notes.lower()

    key_updates = sentences[:5] or ["Site log contained no discrete updates."]

    issue_catalog = {
        "delay": ("Programme slippage", "high", "Work activity is behind the planned sequence.", "Recover float with an additional crew or extended shift."),
        "shortage": ("Material shortage", "high", "Required material is not available at the workface.", "Confirm delivery ETA and re-sequence downstream tasks."),
        "accident": ("Safety incident", "critical", "An incident or near miss was reported.", "Secure the area, complete the incident report, and brief the crew."),
        "unsafe": ("Unsafe condition", "high", "An unsafe practice or condition was observed.", "Stop the task and correct the condition before restart."),
        "leak": ("Water ingress or leak", "medium", "Water is entering or escaping where it should not.", "Trace the source, isolate, and schedule a repair."),
        "damage": ("Damage to works", "medium", "Completed or temporary works have been damaged.", "Record the damage, protect adjacent works, and assign repair."),
        "absent": ("Labor availability", "medium", "Absenteeism is affecting planned output.", "Reallocate tasks and confirm resourcing for the next shift."),
        "breakdown": ("Plant breakdown", "high", "Key equipment is unavailable.", "Dispatch maintenance and activate a standby unit."),
        "inspection": ("Inspection pending", "low", "An inspection or sign-off is required.", "Book the inspector and prepare access and documentation."),
    }
    issues = []
    for keyword, (title, severity, description, action) in issue_catalog.items():
        if keyword in lowered:
            issues.append(
                {
                    "title": title,
                    "severity": severity,
                    "description": description,
                    "suggested_action": action,
                }
            )
    issues = issues[:4]

    action_keywords = ("need", "must", "should", "follow up", "inspect", "order", "repair", "schedule", "confirm", "deliver")
    actionable = [s for s in sentences if any(word in s.lower() for word in action_keywords)]
    if not actionable:
        actionable = [
            "Confirm tomorrow's labor allocation against the look-ahead programme.",
            "Verify close-out of today's open housekeeping and safety items.",
        ]
    owners = ["Site Engineer", "Foreman", "Safety Officer", "Project Manager"]
    action_items = [
        {
            "task": text,
            "owner": owners[(seed + index) % len(owners)],
            "due": "Next shift" if index < 2 else "Within 48 hours",
            "priority": "high" if index == 0 else "medium" if index < 3 else "low",
        }
        for index, text in enumerate(actionable[:5])
    ]

    material_words = ("concrete", "cement", "steel", "rebar", "brick", "block", "timber", "pipe", "cable", "paint", "sand", "aggregate")
    materials = [s for s in sentences if any(word in s.lower() for word in material_words)]
    if not materials:
        materials = ["No material deliveries or shortfalls explicitly recorded in the log."]

    safety_notes = []
    if any(word in lowered for word in ("ppe", "helmet", "harness", "safety", "incident", "unsafe", "hazard")):
        safety_notes.append("The log references a safety matter; verify corrective action at the next walk.")
    safety_notes.extend(
        [
            "Confirm edge protection and access routes remain compliant before shift start.",
            "Check that housekeeping keeps pedestrian routes clear.",
        ]
    )

    tomorrow_focus = request.priorities[:4] or [
        "Close out open high-priority actions before new work fronts open.",
        "Verify material deliveries against the three-day look-ahead.",
        "Walk the active work zones for safety and quality hold points.",
    ]

    workforce = (
        "Workforce references were extracted from the log; confirm actual headcount against "
        "the labor allocation at shift start."
    )
    if re.search(r"\b\d+\s*(workers|operatives|crew|labourers|laborers)\b", lowered):
        match = re.search(r"(\d+)\s*(workers|operatives|crew|labourers|laborers)", lowered)
        if match:
            workforce = f"Approximately {match.group(1)} {match.group(2)} referenced in the site log."

    summary_source = " ".join(sentences[:2]) if sentences else request.notes[:220]
    return {
        "executive_summary": (
            f"{summary_source} "
            f"{len(issues)} issue(s) and {len(action_items)} action item(s) were identified."
        ).strip(),
        "key_updates": key_updates,
        "issues": issues,
        "action_items": action_items,
        "workforce_summary": workforce,
        "materials_and_equipment": materials[:5],
        "safety_observations": safety_notes,
        "tomorrow_focus": tomorrow_focus,
    }


# --------------------------------------------------------------------------- weather

_CONDITIONS = [
    ("Sunny", 5),
    ("Partly cloudy", 15),
    ("Cloudy", 30),
    ("Light rain", 60),
    ("Heavy rain", 85),
    ("Thunderstorms", 90),
    ("Windy", 35),
]


def weather(request: WeatherRequest) -> dict[str, Any]:
    start = request.start_date or date.today()
    seed = _seed("weather", request.location.lower(), start.isoformat())
    base_temp = 12 + seed % 22

    outlook = []
    for offset in range(request.days):
        day_seed = _seed("weather-day", request.location.lower(), str(offset), start.isoformat())
        condition, base_precip = _CONDITIONS[day_seed % len(_CONDITIONS)]
        precip = min(98, base_precip + day_seed % 10)
        wind = round(8 + (day_seed % 45) + (10 if condition == "Windy" else 0), 1)
        low = round(base_temp + (day_seed % 7) - 4, 1)
        high = round(low + 6 + (day_seed % 8), 1)
        outlook.append(
            {
                "date": start + timedelta(days=offset),
                "condition": condition,
                "temp_min_c": low,
                "temp_max_c": high,
                "precipitation_chance": precip,
                "wind_kph": wind,
            }
        )

    activities = request.activities or (
        [f"{request.trade} works"] if request.trade else []
    )
    if not activities:
        activities = ["Earthworks", "Concrete placement", "Steel erection", "Painting", "Roofing"]

    avg_precip = sum(day["precipitation_chance"] for day in outlook) / len(outlook)
    avg_wind = sum(day["wind_kph"] for day in outlook) / len(outlook)
    avg_temp = sum((day["temp_min_c"] + day["temp_max_c"]) / 2 for day in outlook) / len(outlook)

    suitability = []
    for activity in activities:
        key = activity.lower()
        if any(word in key for word in ("paint", "coating", "render", "plaster")):
            if avg_precip > 50 or avg_temp < 8:
                rating, reason = "avoid", "Moisture and low temperature risk the finish."
            elif avg_precip > 30:
                rating, reason = "caution", "Keep a weather eye and protect fresh coats."
            else:
                rating, reason = "good", "Conditions support coating application."
            window = "10:00-15:00"
        elif any(word in key for word in ("concrete", "pour", "screed")):
            if avg_precip > 60:
                rating, reason = "avoid", "Rain will affect placement and curing."
            elif avg_temp > 34 or avg_temp < 5:
                rating, reason = "caution", "Temperature control and curing protection required."
            else:
                rating, reason = "good", "Manageable placement window with normal curing."
            window = "06:00-11:00"
        elif any(word in key for word in ("steel", "erection", "crane", "lifting", "roof")):
            if avg_wind > 35:
                rating, reason = "avoid", "Wind exceeds safe lifting and erection limits."
            elif avg_wind > 25:
                rating, reason = "caution", "Plan lifts for the calmest window and review the lift plan."
            else:
                rating, reason = "good", "Wind is within typical lifting limits."
            window = "07:00-12:00"
        elif any(word in key for word in ("earth", "excavat", "drain")):
            if avg_precip > 65:
                rating, reason = "avoid", "Saturated ground and trench instability risk."
            elif avg_precip > 35:
                rating, reason = "caution", "Expect soft ground and pump requirements."
            else:
                rating, reason = "good", "Ground conditions should remain workable."
            window = "07:00-14:00"
        else:
            if avg_precip > 65 or avg_wind > 40:
                rating, reason = "caution", "Weather may reduce productivity; monitor conditions."
            else:
                rating, reason = "good", "No major weather constraint for general work."
            window = "08:00-16:00"
        suitability.append(
            {
                "activity": activity,
                "suitability": rating,
                "reason": reason,
                "best_window": window,
            }
        )

    advisories = []
    if avg_precip > 50:
        advisories.append("Plan for rain disruption and protect open excavations and fresh concrete.")
    if avg_wind > 30:
        advisories.append("Review lift plans and secure loose materials before wind picks up.")
    if avg_temp > 33:
        advisories.append("Implement heat-stress controls, hydration, and shaded rest cycles.")
    if avg_temp < 8:
        advisories.append("Protect concrete and finishes from low-temperature curing damage.")
    if not advisories:
        advisories.append("No dominant weather constraint detected for the selected window.")

    return {
        "location": request.location,
        "outlook": outlook,
        "suitability": suitability,
        "advisories": advisories,
        "safety_notes": [
            "Re-check the official forecast before high-risk lifts or concrete pours.",
            "Inspect access routes and excavations after any overnight rain.",
            "Secure lightweight materials and signage if gusts increase.",
        ],
        "schedule_impact": (
            "Low impact expected; retain normal weather float."
            if avg_precip < 40
            else "Moderate to high impact likely on external activities; re-sequence indoor work and protect open fronts."
        ),
        "data_note": (
            "This outlook is AI-estimated for planning demonstration only. It is not a live "
            "meteorological feed; confirm against an official weather service."
        ),
    }


# --------------------------------------------------------------------------- knowledge

_CODES = {
    "structural": ["ACI 318 / EN 1992 (Eurocode 2)", "Local building code amendments", "IS 456 where applicable"],
    "safety": ["OSHA 29 CFR 1926", "ISO 45001", "Local work-at-height regulations"],
    "mep": ["NEC / IEC 60364", "ASHRAE 62.1", "International Plumbing Code"],
    "architecture": ["IBC / local zoning code", "NFPA 101 life safety", "Local accessibility standards"],
    "estimating": ["RICS New Rules of Measurement", "Local standard method of measurement"],
    "scheduling": ["PMI practice standard for scheduling", "AACE International RP 49R-06"],
    "general": ["IBC / local building code", "OSHA 29 CFR 1926", "ISO 9001 / ISO 45001"],
}


def knowledge(question: str, discipline: str, has_image: bool) -> dict[str, Any]:
    seed = _seed("knowledge", question.lower(), discipline)
    codes = _CODES.get(discipline, _CODES["general"])
    image_note = (
        "An image was received, but demo mode does not perform vision analysis. Enable Gemini "
        "for image-grounded observations. "
        if has_image
        else ""
    )

    answer = (
        f"{image_note}For the question \"{question}\", start by confirming the governing "
        "drawing revision, specification clause, and local code requirement. Then separate "
        "the decision into safety, structural adequacy, buildability, and cost/time impact. "
        "Where site evidence is incomplete, request a measured survey or inspection rather "
        "than relying on assumptions. Escalate anything affecting primary structure, "
        "fire safety, or a permit condition to the responsible licensed professional before "
        "execution."
    )
    key_points = [
        "Verify the applicable code edition and project specification before selecting a method.",
        "Document existing conditions with dated photos, measurements, and a scale reference.",
        "Use a hold point and independent inspection for any structural or life-safety work.",
        "Record the decision, rationale, and approving authority in the site quality file.",
    ]
    related = _pick(
        seed,
        [
            ["Method statements", "Inspection and test plans", "Non-conformance reporting"],
            ["Quality hold points", "Material submittals", "Site instruction workflow"],
            ["Risk assessment", "Permit to work", "Temporary works register"],
        ],
    )

    return {
        "answer": answer,
        "key_points": key_points,
        "applicable_codes": codes,
        "safety_notes": [
            "Do not proceed with structural or life-safety work without competent sign-off.",
            "Apply the hierarchy of controls and update the risk assessment before work starts.",
        ],
        "related_topics": related,
        "image_analyzed": has_image,
        "confidence": {
            "score": 0.55,
            "rationale": "Deterministic demo guidance; enable Gemini for a grounded, cited answer.",
        },
        "disclaimer": (
            "This is general guidance for planning, not a stamped engineering opinion. "
            "Local codes and a licensed professional govern the final decision."
        ),
    }
