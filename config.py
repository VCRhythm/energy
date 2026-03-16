import os
from dotenv import load_dotenv

load_dotenv()

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

# State area codes used by EIA (duoarea format: S + two-letter state code)
# Maps state abbreviation to EIA duoarea code and full name
STATES = {
    "AL": ("SAL", "Alabama"),
    "AK": ("SAK", "Alaska"),
    "AZ": ("SAZ", "Arizona"),
    "AR": ("SAR", "Arkansas"),
    "CA": ("SCA", "California"),
    "CO": ("SCO", "Colorado"),
    "CT": ("SCT", "Connecticut"),
    "DE": ("SDE", "Delaware"),
    "DC": ("SDC", "District of Columbia"),
    "FL": ("SFL", "Florida"),
    "GA": ("SGA", "Georgia"),
    "HI": ("SHI", "Hawaii"),
    "ID": ("SID", "Idaho"),
    "IL": ("SIL", "Illinois"),
    "IN": ("SIN", "Indiana"),
    "IA": ("SIA", "Iowa"),
    "KS": ("SKS", "Kansas"),
    "KY": ("SKY", "Kentucky"),
    "LA": ("SLA", "Louisiana"),
    "ME": ("SME", "Maine"),
    "MD": ("SMD", "Maryland"),
    "MA": ("SMA", "Massachusetts"),
    "MI": ("SMI", "Michigan"),
    "MN": ("SMN", "Minnesota"),
    "MS": ("SMS", "Mississippi"),
    "MO": ("SMO", "Missouri"),
    "MT": ("SMT", "Montana"),
    "NE": ("SNE", "Nebraska"),
    "NV": ("SNV", "Nevada"),
    "NH": ("SNH", "New Hampshire"),
    "NJ": ("SNJ", "New Jersey"),
    "NM": ("SNM", "New Mexico"),
    "NY": ("SNY", "New York"),
    "NC": ("SNC", "North Carolina"),
    "ND": ("SND", "North Dakota"),
    "OH": ("SOH", "Ohio"),
    "OK": ("SOK", "Oklahoma"),
    "OR": ("SOR", "Oregon"),
    "PA": ("SPA", "Pennsylvania"),
    "RI": ("SRI", "Rhode Island"),
    "SC": ("SSC", "South Carolina"),
    "SD": ("SSD", "South Dakota"),
    "TN": ("STN", "Tennessee"),
    "TX": ("STX", "Texas"),
    "UT": ("SUT", "Utah"),
    "VT": ("SVT", "Vermont"),
    "VA": ("SVA", "Virginia"),
    "WA": ("SWA", "Washington"),
    "WV": ("SWV", "West Virginia"),
    "WI": ("SWI", "Wisconsin"),
    "WY": ("SWY", "Wyoming"),
}

# Reverse lookup: EIA duoarea code -> state abbreviation
DUOAREA_TO_STATE = {v[0]: k for k, v in STATES.items()}

# National average area code
NATIONAL_AREA = "NUS"
