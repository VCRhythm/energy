import os
from dotenv import load_dotenv

load_dotenv()

try:
    import streamlit as st
    EIA_API_KEY = st.secrets.get("EIA_API_KEY", "")
except Exception:
    EIA_API_KEY = os.getenv("EIA_API_KEY", "")
EIA_BASE_URL = "https://api.eia.gov/v2"

# EIA product codes for diesel
PRODUCTS = {
    "EPD2D": "No 2 Diesel",
    "EPD2DXL0": "No 2 Diesel (Ultra-Low Sulfur, 15 ppm & under)",
}

# Default product to display
DEFAULT_PRODUCT = "EPD2DXL0"

# PADD regions
PADD_REGIONS = {
    "R10": "PADD 1 - East Coast",
    "R1X": "PADD 1A - New England",
    "R1Y": "PADD 1B - Central Atlantic",
    "R1Z": "PADD 1C - Lower Atlantic",
    "R20": "PADD 2 - Midwest",
    "R30": "PADD 3 - Gulf Coast",
    "R40": "PADD 4 - Rocky Mountain",
    "R50": "PADD 5 - West Coast",
    "R5XCA": "PADD 5 - West Coast (excl. CA)",
}

# National average area code
NATIONAL_AREA = "NUS"

# California (reported separately from PADD 5)
CALIFORNIA_AREA = "SCA"

# All areas available for comparison (national + PADD regions + California)
# Map each US state to its PADD sub-region area code
STATE_TO_PADD = {
    # PADD 1A - New England
    "CT": "R1X", "ME": "R1X", "MA": "R1X", "NH": "R1X", "RI": "R1X", "VT": "R1X",
    # PADD 1B - Central Atlantic
    "DE": "R1Y", "DC": "R1Y", "MD": "R1Y", "NJ": "R1Y", "NY": "R1Y", "PA": "R1Y",
    # PADD 1C - Lower Atlantic
    "FL": "R1Z", "GA": "R1Z", "NC": "R1Z", "SC": "R1Z", "VA": "R1Z", "WV": "R1Z",
    # PADD 2 - Midwest
    "IL": "R20", "IN": "R20", "IA": "R20", "KS": "R20", "KY": "R20", "MI": "R20",
    "MN": "R20", "MO": "R20", "NE": "R20", "ND": "R20", "OH": "R20", "OK": "R20",
    "SD": "R20", "TN": "R20", "WI": "R20",
    # PADD 3 - Gulf Coast
    "AL": "R30", "AR": "R30", "LA": "R30", "MS": "R30", "NM": "R30", "TX": "R30",
    # PADD 4 - Rocky Mountain
    "CO": "R40", "ID": "R40", "MT": "R40", "UT": "R40", "WY": "R40",
    # PADD 5 - West Coast (excl. CA)
    "AK": "R5XCA", "AZ": "R5XCA", "HI": "R5XCA", "NV": "R5XCA", "OR": "R5XCA", "WA": "R5XCA",
    # California
    "CA": "SCA",
}

ALL_SELECTABLE_AREAS = {
    "U.S. National Average": "NUS",
    "PADD 1 - East Coast": "R10",
    "PADD 1A - New England": "R1X",
    "PADD 1B - Central Atlantic": "R1Y",
    "PADD 1C - Lower Atlantic": "R1Z",
    "PADD 2 - Midwest": "R20",
    "PADD 3 - Gulf Coast": "R30",
    "PADD 4 - Rocky Mountain": "R40",
    "PADD 5 - West Coast": "R50",
    "PADD 5 - West Coast (excl. CA)": "R5XCA",
    "California": "SCA",
}
