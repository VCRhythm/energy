"""EIA API v2 client for fetching retail diesel price data."""

import requests
import pandas as pd
from config import EIA_BASE_URL, EIA_API_KEY, NATIONAL_AREA, CALIFORNIA_AREA


def _make_request(endpoint: str, params: dict) -> dict:
    """Make a request to the EIA API v2 and return the JSON response."""
    params["api_key"] = EIA_API_KEY
    url = f"{EIA_BASE_URL}/{endpoint}"
    resp = requests.get(url, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    if "response" not in data:
        raise ValueError(f"Unexpected EIA API response: {data}")
    return data["response"]


def fetch_current_prices(product: str = "EPD2DXL0") -> pd.DataFrame:
    """Fetch the latest weekly diesel prices for all areas.

    Returns a DataFrame with columns:
        period, duoarea, area_name, product, product_name, price
    """
    params = {
        "frequency": "weekly",
        "data[0]": "value",
        "facets[product][]": product,
        "sort[0][column]": "period",
        "sort[0][direction]": "desc",
        "length": 200,
    }
    response = _make_request("petroleum/pri/gnd/data/", params)
    rows = response.get("data", [])
    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df = df.rename(columns={
        "area-name": "area_name",
        "product-name": "product_name",
        "value": "price",
    })

    # Keep only the latest period
    latest_period = df["period"].max()
    df_latest = df[df["period"] == latest_period].copy()

    # Also get previous period for week-over-week change
    periods = sorted(df["period"].unique(), reverse=True)
    if len(periods) >= 2:
        prev_period = periods[1]
        df_prev = df[df["period"] == prev_period][["duoarea", "price"]].copy()
        df_prev = df_prev.rename(columns={"price": "prev_price"})
        df_latest = df_latest.merge(df_prev, on="duoarea", how="left")
        df_latest["price"] = pd.to_numeric(df_latest["price"], errors="coerce")
        df_latest["prev_price"] = pd.to_numeric(df_latest["prev_price"], errors="coerce")
        df_latest["change"] = df_latest["price"] - df_latest["prev_price"]
    else:
        df_latest["price"] = pd.to_numeric(df_latest["price"], errors="coerce")
        df_latest["prev_price"] = None
        df_latest["change"] = None

    return df_latest


def fetch_price_history(
    area_code: str = "NUS",
    product: str = "EPD2DXL0",
    periods: int = 52,
) -> pd.DataFrame:
    """Fetch historical weekly diesel prices for a specific area.

    Args:
        area_code: EIA duoarea code (e.g., 'NUS' for national, 'SCA' for California)
        product: EIA product code
        periods: Number of weekly data points to fetch

    Returns a DataFrame with columns: period, price
    """
    params = {
        "frequency": "weekly",
        "data[0]": "value",
        "facets[product][]": product,
        "facets[duoarea][]": area_code,
        "sort[0][column]": "period",
        "sort[0][direction]": "desc",
        "length": periods,
    }
    response = _make_request("petroleum/pri/gnd/data/", params)
    rows = response.get("data", [])
    if not rows:
        return pd.DataFrame()

    df = pd.DataFrame(rows)
    df = df.rename(columns={"value": "price", "area-name": "area_name"})
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df["period"] = pd.to_datetime(df["period"])
    df = df.sort_values("period")
    return df


def fetch_multi_area_history(
    area_codes: list[str],
    product: str = "EPD2DXL0",
    periods: int = 52,
) -> pd.DataFrame:
    """Fetch historical prices for multiple areas, returned as a single DataFrame."""
    frames = []
    for code in area_codes:
        df = fetch_price_history(code, product, periods)
        if not df.empty:
            frames.append(df)
    if not frames:
        return pd.DataFrame()
    return pd.concat(frames, ignore_index=True)



def get_regional_prices(product: str = "EPD2DXL0") -> pd.DataFrame:
    """Get latest diesel prices for PADD regions and California.

    Returns DataFrame sorted by price ascending (cheapest first).
    """
    from config import PADD_REGIONS
    df = fetch_current_prices(product)
    if df.empty:
        return df
    # PADD regions
    regions = df[df["duoarea"].isin(PADD_REGIONS.keys())].copy()
    regions["region_name"] = regions["duoarea"].map(PADD_REGIONS)
    # Include California (reported separately from PADD 5)
    ca = df[df["duoarea"] == CALIFORNIA_AREA].copy()
    if not ca.empty:
        ca["region_name"] = "California"
        regions = pd.concat([regions, ca], ignore_index=True)
    return regions.sort_values("price", ascending=True)
