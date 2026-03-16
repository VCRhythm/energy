# U.S. Diesel Price Dashboard

A Streamlit web dashboard that displays weekly retail diesel prices across all U.S. states, powered by the [EIA Open Data API](https://www.eia.gov/opendata/).

## Features

- **National summary** with current average, cheapest/most expensive states
- **Interactive choropleth map** of diesel prices by state
- **State rankings table** sorted by price (cheapest first)
- **Price history charts** with multi-state comparison
- **PADD regional comparison** bar charts

## Setup

### 1. Get an EIA API Key

Register for a free key at: https://www.eia.gov/opendata/register.php

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure API Key

Create a `.env` file:

```bash
cp .env.example .env
# Edit .env and add your API key
```

Or enter it directly in the dashboard sidebar.

### 4. Run

```bash
streamlit run app.py
```

## Data Source

Weekly retail diesel prices from the U.S. Energy Information Administration (EIA). Data is published every Tuesday.

- **No 2 Diesel** and **Ultra-Low Sulfur Diesel** (15 ppm & under)
- State-level, regional (PADD), and national averages
- Historical data going back several years
