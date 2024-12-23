# 📊 Crypto Price Alert API

![Sample Agent](https://github.com/krrakash/smart-agent/blob/main/Project_Running.gif)

## 🚀 Project Overview

This **Crypto Price Alert API** monitors cryptocurrency prices and allows users to:

- Automatically fetch and store prices for Ethereum and Polygon every minute.
- Notify users via email if a cryptocurrency's price increases by more than 3% compared to one hour ago.
- Allow users to set price alerts for specific thresholds.
- Fetch historical hourly price data for the last 24 hours.
- Calculate swap rates for Ethereum to Bitcoin, including fees.
### 🔄 Automated Tasks

- **Fetch and Save Prices:** Automatically fetches Ethereum and Polygon prices at regular intervals.
- **Price Increase Alerts:** Sends email notifications if a cryptocurrency's price rises significantly.
### 📡 API Endpoints
## 🛠 Setup Functionality

When the project is run for the first time, it will automatically fetch the last 24 hours of prices for both Ethereum and Polygon at 60-minute intervals. This ensures the database is populated with historical data immediately.


#### 1. **Set Price Alert**

- **Description:** Allows users to set price alerts for specific thresholds.
- **Endpoint:** `POST /price/set-alert`
- **Request Body:**
  ```json
  {
    "chain": "ethereum",
    "dollar": 1000,
    "email": "user@example.com"
  }
#### 2. **Fetch Hourly Prices**

- **Description:** Fetches hourly price data for the last 24 hours.
- **Endpoint:** `GET /price/hourly`
- **Query Parameters:**
  - `chain` (string): The blockchain (e.g., `ethereum` or `polygon`).
#### 3. **Calculate Swap Rate**

- **Description:** Calculates the Bitcoin received for a given amount of Ethereum.
- **Endpoint:** `GET /price/swap-rate`
- **Query Parameters:**
  - `ethAmount` (number): The amount of Ethereum to swap.
### 🔔 Alerts

- Users are notified via email when their set threshold is breached.
- Alerts are removed automatically after being triggered.

### 📈 Historical Data

- Returns detailed price information, including max, min, and average prices for hourly intervals.
## 🐳 Docker Support

The project is fully containerized. Run the following command to spin up the entire stack:

```bash
docker-compose up --build
