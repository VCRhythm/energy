"""U.S. Diesel Price Comparison Dashboard."""

import streamlit as st
import pandas as pd
import plotly.express as px

import config
from eia_client import (
    fetch_current_prices,
    fetch_multi_area_history,
    get_regional_prices,
)

st.set_page_config(
    page_title="U.S. Diesel Price Dashboard",
    page_icon="⛽",
    layout="wide",
)

# --- Sidebar ---
st.sidebar.title("Settings")

# API key: prefer env var, allow override in sidebar
api_key = config.EIA_API_KEY
if not api_key:
    api_key = st.sidebar.text_input(
        "EIA API Key",
        type="password",
        help="Get a free key at https://www.eia.gov/opendata/register.php",
    )
    if api_key:
        config.EIA_API_KEY = api_key

if not config.EIA_API_KEY:
    st.title("U.S. Diesel Price Dashboard")
    st.warning("Please enter your EIA API key in the sidebar to get started.")
    st.markdown(
        """
        ### Setup
        1. Register for a free API key at [EIA Open Data](https://www.eia.gov/opendata/register.php)
        2. Either:
           - Enter the key in the sidebar, or
           - Create a `.env` file with `EIA_API_KEY=your_key_here`
        """
    )
    st.stop()

# Product selector
product_options = {v: k for k, v in config.PRODUCTS.items()}
product_label = st.sidebar.selectbox(
    "Diesel Type",
    options=list(product_options.keys()),
    index=0,
)
selected_product = product_options[product_label]

# History length
history_weeks = st.sidebar.slider("History (weeks)", 12, 104, 52)


# --- Cached data fetching ---
@st.cache_data(ttl=3600, show_spinner=False)
def _load_current_prices(product):
    return fetch_current_prices(product)


@st.cache_data(ttl=3600, show_spinner=False)
def _load_regional_prices(product):
    return get_regional_prices(product)


@st.cache_data(ttl=3600, show_spinner=False)
def _load_multi_history(area_codes, product, periods):
    return fetch_multi_area_history(area_codes, product, periods)


# --- Main Dashboard ---
st.title("U.S. Diesel Price Dashboard")

try:
    with st.spinner("Loading current prices..."):
        all_prices = _load_current_prices(selected_product)
        regional_prices = _load_regional_prices(selected_product)
except Exception as e:
    st.error(f"Failed to fetch data from EIA: {e}")
    st.stop()

if all_prices.empty:
    st.warning("No data returned from EIA. Check your API key and try again.")
    st.stop()

# --- National Summary ---
national = all_prices[all_prices["duoarea"] == config.NATIONAL_AREA]
if not national.empty:
    nat = national.iloc[0]
    st.caption(f"Data as of week ending {nat['period']}")

    col1, col2, col3, col4 = st.columns(4)
    col1.metric(
        "National Average",
        f"${nat['price']:.3f}/gal" if pd.notna(nat["price"]) else "N/A",
        f"{nat['change']:+.3f}" if pd.notna(nat.get("change")) else None,
    )

    if not regional_prices.empty:
        valid = regional_prices.dropna(subset=["price"])
        if not valid.empty:
            cheapest = valid.iloc[0]
            most_expensive = valid.iloc[-1]
            col2.metric("Cheapest Region", cheapest["region_name"], f"${cheapest['price']:.3f}/gal")
            col3.metric("Most Expensive Region", most_expensive["region_name"], f"${most_expensive['price']:.3f}/gal")
            col4.metric("Regional Spread", f"${most_expensive['price'] - cheapest['price']:.3f}/gal")

# --- Regional Comparison Bar Chart ---
st.subheader("Regional Diesel Prices")

if not regional_prices.empty:
    rp = regional_prices.dropna(subset=["price"]).copy()
    if not rp.empty:
        fig_reg = px.bar(
            rp,
            x="region_name",
            y="price",
            color="price",
            color_continuous_scale="RdYlGn_r",
            labels={"price": "$/gallon", "region_name": "Region"},
            hover_data={"price": ":.3f", "change": ":.3f"},
        )
        fig_reg.update_layout(
            showlegend=False,
            height=400,
            xaxis_tickangle=-45,
        )
        st.plotly_chart(fig_reg, width="stretch")

# --- Regional Rankings Table ---
st.subheader("Regional Rankings (Cheapest First)")

if not regional_prices.empty:
    display_df = regional_prices.dropna(subset=["price"])[
        ["region_name", "price", "change"]
    ].copy()
    display_df.columns = ["Region", "Price ($/gal)", "Weekly Change"]
    display_df = display_df.reset_index(drop=True)
    display_df.index = display_df.index + 1

    st.dataframe(
        display_df.style.format({
            "Price ($/gal)": "${:.3f}",
            "Weekly Change": "{:+.3f}",
        }).background_gradient(
            subset=["Price ($/gal)"],
            cmap="RdYlGn_r",
        ),
        width="stretch",
        height=400,
    )

# --- Price History ---
st.subheader("Price History")

selected_areas = st.multiselect(
    "Select areas to compare",
    options=list(config.ALL_SELECTABLE_AREAS.keys()),
    default=["U.S. National Average"],
)

if selected_areas:
    area_codes = [config.ALL_SELECTABLE_AREAS[name] for name in selected_areas]
    with st.spinner("Loading history..."):
        history = _load_multi_history(tuple(area_codes), selected_product, history_weeks)

    if not history.empty:
        fig_hist = px.line(
            history,
            x="period",
            y="price",
            color="area_name",
            labels={"price": "$/gallon", "period": "Week", "area_name": "Area"},
            hover_data={"price": ":.3f"},
        )
        fig_hist.update_layout(
            hovermode="x unified",
            height=400,
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        )
        st.plotly_chart(fig_hist, width="stretch")
    else:
        st.info("No historical data available for the selected areas.")

# --- Footer ---
st.divider()
st.caption(
    "Data source: [U.S. Energy Information Administration (EIA)](https://www.eia.gov/petroleum/gasdiesel/). "
    "Prices updated weekly (Tuesdays)."
)
