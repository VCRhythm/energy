"""Fetch EIA data and save to CSV files for offline/hosted use.

Run locally: python scripts/refresh_data.py
Requires EIA_API_KEY in .env or environment.
"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from eia_client import fetch_current_prices, fetch_multi_area_history
from config import ALL_SELECTABLE_AREAS, PRODUCTS

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
MAX_HISTORY_WEEKS = 104


def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    for product_code in PRODUCTS:
        print(f"Fetching current prices for {product_code}...")
        current = fetch_current_prices(product_code)
        current.to_csv(os.path.join(DATA_DIR, f"current_{product_code}.csv"), index=False)
        print(f"  Saved {len(current)} rows")

        print(f"Fetching {MAX_HISTORY_WEEKS}-week history for {product_code}...")
        area_codes = list(ALL_SELECTABLE_AREAS.values())
        history = fetch_multi_area_history(area_codes, product_code, MAX_HISTORY_WEEKS)
        history.to_csv(os.path.join(DATA_DIR, f"history_{product_code}.csv"), index=False)
        print(f"  Saved {len(history)} rows")

    print("Done! Data saved to data/")


if __name__ == "__main__":
    main()
