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
