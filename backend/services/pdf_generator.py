"""
PDF Report Generation Module
Generates printable HTML reports that can be saved as PDF
"""

import random
from datetime import datetime, timezone
from typing import Dict, List, Optional

from ..county_data import KENYA_COUNTIES
from ..services.county_analytics import county_analytics


def generate_html_report(county_name: str, report_type: str = "comprehensive", period: str = "month") -> str:
    stats = county_analytics.get_county_stats(county_name, period)
    
    county = next((c for c in KENYA_COUNTIES if c.name == county_name), None)
    if not county:
        return "<h1>County not found</h1>"
    
    risk_level = "HIGH" if stats.risk_score >= 60 else "MEDIUM" if stats.risk_score >= 40 else "LOW"
    risk_color = "#dc2626" if risk_level == "HIGH" else "#ea580c" if risk_level == "MEDIUM" else "#16a34a"
    
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Road Safety Report - {county_name}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }}
        .header {{ text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e40af; padding-bottom: 20px; }}
        .header h1 {{ color: #1e40af; font-size: 28px; margin-bottom: 5px; }}
        .header p {{ color: #666; font-size: 14px; }}
        .section {{ margin-bottom: 25px; }}
        .section h2 {{ color: #1e40af; font-size: 18px; border-left: 4px solid #1e40af; padding-left: 10px; margin-bottom: 15px; }}
        .metrics {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px; }}
        .metric {{ background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; }}
        .metric .value {{ font-size: 24px; font-weight: bold; color: #1e40af; }}
        .metric .label {{ font-size: 12px; color: #666; text-transform: uppercase; }}
        .risk-badge {{ display: inline-block; padding: 5px 15px; border-radius: 20px; color: white; font-weight: bold; font-size: 14px; background: {risk_color}; }}
        table {{ width: 100%; border-collapse: collapse; margin-bottom: 15px; }}
        th, td {{ padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }}
        th {{ background: #f1f5f9; font-weight: 600; font-size: 12px; text-transform: uppercase; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #666; }}
        @media print {{ body {{ padding: 20px; }} }}
    </style>
</head>
<body>
    <div class="header">
        <h1>KENYA OVERWATCH SYSTEM</h1>
        <p>Road Safety Analysis Report - {county_name}</p>
        <p>Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
    </div>
    
    <div class="section">
        <h2>County Overview</h2>
        <table>
            <tr><td width="40%"><strong>County:</strong></td><td>{county_name}</td></tr>
            <tr><td><strong>Region:</strong></td><td>{county.region.value}</td></tr>
            <tr><td><strong>Capital:</strong></td><td>{county.capital}</td></tr>
            <tr><td><strong>Population:</strong></td><td>{county.population:,}</td></tr>
            <tr><td><strong>Area:</strong></td><td>{county.area_sq_km:,} km²</td></tr>
            <tr><td><strong>Risk Level:</strong></td><td><span class="risk-badge">{risk_level}</span> (Score: {stats.risk_score})</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Key Statistics ({period.title()})</h2>
        <div class="metrics">
            <div class="metric">
                <div class="value">{stats.total_accidents}</div>
                <div class="label">Accidents</div>
            </div>
            <div class="metric">
                <div class="value">{stats.total_violations}</div>
                <div class="label">Violations</div>
            </div>
            <div class="metric">
                <div class="value">{stats.fatalities}</div>
                <div class="label">Fatalities</div>
            </div>
            <div class="metric">
                <div class="value">{stats.injuries}</div>
                <div class="label">Injuries</div>
            </div>
            <div class="metric">
                <div class="value">{stats.risk_score}</div>
                <div class="label">Risk Score</div>
            </div>
            <div class="metric">
                <div class="value" style="text-transform: capitalize;">{stats.trend}</div>
                <div class="label">Trend</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>Incident Breakdown</h2>
        <table>
            <tr><th>Incident Type</th><th>Count</th></tr>
"""
    
    for incident_type, count in stats.incident_types.items():
        html += f"            <tr><td>{incident_type}</td><td>{count}</td></tr>\n"
    
    html += """
        </table>
    </div>
    
    <div class="section">
        <h2>Severity Distribution</h2>
        <table>
            <tr><th>Severity</th><th>Count</th><th>Percentage</th></tr>
"""
    
    total = sum(stats.severity_breakdown.values())
    for severity, count in stats.severity_breakdown.items():
        pct = (count / total * 100) if total > 0 else 0
        html += f"            <tr><td>{severity}</td><td>{count}</td><td>{pct:.1f}%</td></tr>\n"
    
    html += """
        </table>
    </div>
    
    <div class="section">
        <h2>High-Risk Roads</h2>
        <table>
            <tr><th>Road Name</th><th>Accidents</th><th>Risk Level</th></tr>
"""
    
    for road in stats.top_roads:
        html += f"            <tr><td>{road['name']}</td><td>{road['accidents']}</td><td>{road['risk_level'].upper()}</td></tr>\n"
    
    html += """
        </table>
    </div>
    
    <div class="section">
        <h2>Major Roads in County</h2>
        <ul>
"""
    
    for road in county.major_roads:
        html += f"            <li>{road}</li>\n"
    
    html += """
        </ul>
    </div>
    
    <div class="section">
        <h2>Risk Factors</h2>
        <ul>
"""
    
    for factor in county.risk_factors:
        html += f"            <li>{factor}</li>\n"
    
    html += f"""
        </ul>
    </div>
    
    <div class="footer">
        <p>Kenya Overwatch System - National Road Safety Monitoring Platform</p>
        <p>Report ID: RPT-{random.randint(100000, 999999)} | Period: {period}</p>
    </div>
</body>
</html>
"""
    return html


def generate_all_counties_html_report(period: str = "month") -> str:
    all_counties = county_analytics.get_all_counties_summary(period)
    regions = county_analytics.get_region_summary()
    
    total_accidents = sum(c["total_accidents"] for c in all_counties)
    total_violations = sum(c["total_violations"] for c in all_counties)
    total_fatalities = sum(c["fatalities"] for c in all_counties)
    avg_risk = sum(c["risk_score"] for c in all_counties) / len(all_counties)
    
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>National Road Safety Report - Kenya</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: 'Segoe UI', Arial, sans-serif; color: #333; line-height: 1.6; padding: 40px; max-width: 1000px; margin: 0 auto; }}
        .header {{ text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e40af; padding-bottom: 20px; }}
        .header h1 {{ color: #1e40af; font-size: 32px; margin-bottom: 5px; }}
        .header p {{ color: #666; font-size: 14px; }}
        .section {{ margin-bottom: 25px; }}
        .section h2 {{ color: #1e40af; font-size: 18px; border-left: 4px solid #1e40af; padding-left: 10px; margin-bottom: 15px; }}
        .metrics {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }}
        .metric {{ background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; }}
        .metric .value {{ font-size: 28px; font-weight: bold; color: #1e40af; }}
        .metric .label {{ font-size: 12px; color: #666; text-transform: uppercase; }}
        table {{ width: 100%; border-collapse: collapse; margin-bottom: 15px; }}
        th, td {{ padding: 8px 10px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; }}
        th {{ background: #f1f5f9; font-weight: 600; font-size: 11px; text-transform: uppercase; }}
        .high-risk {{ color: #dc2626; font-weight: bold; }}
        .medium-risk {{ color: #ea580c; }}
        .low-risk {{ color: #16a34a; }}
        .footer {{ margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>KENYA OVERWATCH SYSTEM</h1>
        <p>National Road Safety Analysis Report - All 47 Counties</p>
        <p>Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}</p>
    </div>
    
    <div class="section">
        <h2>National Overview</h2>
        <div class="metrics">
            <div class="metric">
                <div class="value">47</div>
                <div class="label">Counties</div>
            </div>
            <div class="metric">
                <div class="value">{total_accidents:,}</div>
                <div class="label">Total Accidents</div>
            </div>
            <div class="metric">
                <div class="value">{total_violations:,}</div>
                <div class="label">Total Violations</div>
            </div>
            <div class="metric">
                <div class="value">{total_fatalities:,}</div>
                <div class="label">Total Fatalities</div>
            </div>
            <div class="metric">
                <div class="value">{avg_risk:.1f}</div>
                <div class="label">Avg Risk Score</div>
            </div>
            <div class="metric">
                <div class="value">{len([c for c in all_counties if c['risk_score'] >= 60])}</div>
                <div class="label">High Risk</div>
            </div>
            <div class="metric">
                <div class="value">{len([c for c in all_counties if 40 <= c['risk_score'] < 60])}</div>
                <div class="label">Medium Risk</div>
            </div>
            <div class="metric">
                <div class="value">{len([c for c in all_counties if c['risk_score'] < 40])}</div>
                <div class="label">Low Risk</div>
            </div>
        </div>
    </div>
    
    <div class="section">
        <h2>County Rankings (Top 20 by Risk Score)</h2>
        <table>
            <tr><th>Rank</th><th>County</th><th>Region</th><th>Accidents</th><th>Fatalities</th><th>Risk Score</th><th>Trend</th></tr>
"""
    
    for i, c in enumerate(all_counties[:20], 1):
        risk_class = "high-risk" if c["risk_score"] >= 60 else "medium-risk" if c["risk_score"] >= 40 else "low-risk"
        html += f"            <tr><td>{i}</td><td>{c['name']}</td><td>{c['region']}</td><td>{c['total_accidents']}</td><td>{c['fatalities']}</td><td class='{risk_class}'>{c['risk_score']}</td><td>{c['trend']}</td></tr>\n"
    
    html += """
        </table>
    </div>
    
    <div class="section">
        <h2>Regional Summary</h2>
        <table>
            <tr><th>Region</th><th>Counties</th><th>Total Accidents</th><th>Total Fatalities</th><th>Avg Risk</th></tr>
"""
    
    for r in regions:
        html += f"            <tr><td>{r['region']}</td><td>{r['county_count']}</td><td>{r['total_accidents']}</td><td>{r['total_fatalities']}</td><td>{r['risk_score']:.1f}</td></tr>\n"
    
    html += f"""
        </table>
    </div>
    
    <div class="footer">
        <p>Kenya Overwatch System - National Road Safety Monitoring Platform</p>
        <p>Report ID: RPT-{random.randint(100000, 999999)} | Period: {period}</p>
    </div>
</body>
</html>
"""
    return html
