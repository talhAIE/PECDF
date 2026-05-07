# Final Year Project Documentation: Export Demand Forecasting System for Pakistan

## 1. Project Overview & Goal
### **The Problem**
Pakistan's economy heavily relies on its export sector to maintain foreign exchange reserves and economic stability. However, global demand is highly volatile, influenced by macroeconomic factors like exchange rates, fuel costs, and Western consumer sentiment.

### **The Goal**
The primary goal of this project is to build a robust, production-ready Machine Learning system that forecasts the **Export Value (USD)** of Pakistan’s top commodities. By leveraging historical trade data and external macroeconomic drivers, this forecasting engine will empower policymakers, stakeholders, and exporters to:
* Manage financial risks.
* Stabilize foreign exchange earnings.
* Perform "What-If" scenario planning based on changing global economic conditions.

---

## 2. Data Collected So Far
We have successfully extracted 16 years of monthly data (January 2010 to December 2025) from highly authoritative global databases.

### **A. Target Data: UN Comtrade Database**
Instead of suffering from the "curse of dimensionality" by using thousands of codes, we aggregated the data at the 4-digit HS Code level and selected a highly diverse "Dream Team" of 10 commodities representing different sectors of Pakistan's economy:
* **Agriculture:** Rice (1006), Oil/Sesame Seeds (1207)
* **Heavy Industry & Minerals:** Refined Copper (7403), Cement (2523)
* **Textile Supply Chain:** Cotton Yarn (5205), Bed/Table Linens (6302), Men's Suits (6203), Winter Wear (6110)
* **Specialized Manufacturing:** Medical Instruments (9018), Sports Goods/Footballs (9506)

### **B. External Economic Drivers**
To give the ML model context on *why* demand changes, we extracted:
* **USD/PKR Exchange Rate:** Monthly close (Source: Yahoo Finance)
* **Brent Crude Oil Prices:** Monthly average (Source: Yahoo Finance)
* **US Consumer Confidence Index (UMCSENT):** Monthly sentiment (Source: Federal Reserve Economic Data - FRED)

---

## 3. Features of the Current Data
Currently, the data exists in separate, clean CSV files with a standardized timeline.

### **UN Comtrade Data Features:**
* `Date_YYYYMM`: The standardized monthly timeline (e.g., '201001').
* `Reporter`: Pakistan.
* `Partner`: World (Global demand).
* `HS_Code`: 4-digit commodity identifier.
* `Commodity_Name`: English description of the good.
* `Export_Value_USD`: The actual dollar amount traded **(Our Target Variable)**.
* *(Note on Net Weight: The `Net_Weight_KG` column was intentionally dropped. Real-world reporting for apparel and medical instruments uses piece-counts instead of weights, leading to 100% missing values for certain sectors. Focusing strictly on USD ensures 100% data completeness and aligns with the macroeconomic goal).*

### **External Driver Features:**
* `USD_PKR_Close`: Indicates currency devaluation and export competitiveness.
* `Brent_Oil_Avg`: Proxy for global manufacturing and shipping/transportation costs.
* `US_Consumer_Confidence`: Proxy for Western purchasing power and retail demand.

---

## 4. The Final Master Dataset (Expected Features)
In the first phase of our workflow, these separate files will be merged into a single **Master_FYP_Dataset**. 

**The expected features fed into the model will be:**
1. `Date_YYYYMM` (Index)
2. `HS_Code` (Categorical identifier)
3. `Export_Value_USD` (Target/Output)
4. `USD_PKR_Close` (External Driver)
5. `Brent_Oil_Avg` (External Driver)
6. `US_Consumer_Confidence` (External Driver)
7. **Engineered Features (To be created):**
   * *Lag Features:* 1-month, 3-month, and 6-month historical lags.
   * *Rolling Averages:* 3-month and 6-month moving averages to smooth out noise.
   * *Temporal/Seasonal Math:* Sine and Cosine transformations of the month to help the model understand cyclic seasonality.

---

## 5. Modeling Strategy & Expected Results
Since our goal is to predict a continuous numerical value (`Export_Value_USD`) across 10 distinct commodity categories, this is framed as a **Multivariate Time-Series Regression** problem. 

To demonstrate a rigorous scientific approach, we will evaluate a progression of models, moving from simple baselines to advanced gradient boosting algorithms that excel at handling categorical features.

### **Models to be Evaluated:**
1. **Random Forest Regressor (The Advanced Baseline):** An ensemble of decision trees that can naturally isolate different commodity categories.
2. **XGBoost (Extreme Gradient Boosting):** The industry standard for tabular data. We will utilize its `enable_categorical=True` parameter to handle the 10 HS Codes.
3. **CatBoost (Categorical Boosting):** Specifically built to dominate datasets where categorical features (like HS Codes) are the most critical signals.
4. **LightGBM (The Champion):** Selected for its native categorical support, blazing-fast speed, and memory efficiency. It builds trees leaf-wise, capturing complex non-linear relationships between specific commodities and external drivers.
5. **LSTM (Deep Learning Bonus):** A Long Short-Term Memory neural network to capture deep sequential patterns over time.

*(Note: For standard regressors that do not inherently support multi-target outputs, we will utilize `MultiOutputRegressor()` from scikit-learn as a wrapper to predict all 10 commodities efficiently).*

### **Expected Results:**
Based on the project's baseline architecture, **LightGBM** is expected to be the champion model. Our goal is to achieve a **MAPE (Mean Absolute Percentage Error) of < 25%** (historically targeted around ~21.74%) and an **R² > 0.70**.

---

## 6. Current Workflow: The 4-Notebook Architecture
To maintain industry-standard MLOps practices, the core Machine Learning pipeline is strictly divided into four distinct Jupyter Notebooks:

### **Notebook 1: Data Engineering & Merging**
* **Purpose:** Create the "Single Source of Truth."
* **Tasks:** Load the Comtrade and External Driver CSVs, merge them on `Date_YYYYMM`, handle any missing edge cases, generate the mathematical Lag/Rolling features, and save the final `Master_FYP_Dataset.csv`.

### **Notebook 2: Exploratory Data Analysis (EDA)**
* **Purpose:** Visual storytelling and statistical validation.
* **Tasks:** Generate correlation heatmaps, time-series trend lines, and feature importance charts. 

### **Notebook 3: Training & Experiments**
* **Purpose:** Find and save the champion model.
* **Tasks:** Split data into Train (2010-2023) and Test (2024-2025). Train the suite of regressors (Linear, Random Forest, XGBoost, CatBoost, LightGBM). Evaluate using MAPE/RMSE/R². Save the winning model to the hard drive as a `.pkl` file.

### **Notebook 4: Inference (The Backend Sandbox)**
* **Purpose:** Safely test the model exactly how the production server will use it.
* **Tasks:** Load the `.pkl` file without training anything. Feed it a hypothetical row of future data and generate a prediction. This code acts as the exact blueprint for the FastAPI backend.

---

## 7. Future Scope: The Full-Stack Application
Once the 4-Notebook pipeline is complete, the project will transition into software engineering:
1. **The Backend (FastAPI):** A high-speed Python API hosting the `.pkl` model.
2. **Scenario Simulator:** Endpoints allowing users to adjust sliders for Oil and USD/PKR to instantly recalculate future export trends.
3. **Agentic RAG Chatbot (LangChain):** An advanced AI assistant integrated into the backend that can query the forecast database using Pandas agents, perform web searches for live trade news, and answer user questions regarding Pakistan's export ecosystem.
4. **Deployment:** Hosting the backend on Render/Railway and integrating it with a modern frontend dashboard.
