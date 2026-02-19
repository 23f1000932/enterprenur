from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import pandas as pd
import numpy as np
from scipy import stats
import statsmodels.api as sm
from io import BytesIO, StringIO
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field
import base64
import os
import logging
from datetime import datetime
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.preprocessing import StandardScaler, MinMaxScaler

# ============= LOGGING SETUP =============
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============= FASTAPI APP INITIALIZATION =============
app = FastAPI(
    title="StatAnalyzer Pro - Enterprise Edition",
    description="Advanced Business Intelligence & Statistical Analysis Platform",
    version="3.0.0"
)

# ============= CORS MIDDLEWARE =============
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= GLOBAL DATA STORE =============
data_store: Dict[str, pd.DataFrame] = {}

# ============= PYDANTIC MODELS =============

class HypothesisTestRequest(BaseModel):
    data_id: str
    column: str
    mu0: float
    alpha: float = 0.05

class RegressionRequest(BaseModel):
    data_id: str
    y_column: str
    x_column: str

class ANOVARequest(BaseModel):
    data_id: str
    value_column: str
    group_column: str

class NormalityTestRequest(BaseModel):
    data_id: str
    column: str
    alpha: float = 0.05

class BusinessMetricsRequest(BaseModel):
    data_id: str
    revenue_column: str
    cost_column: Optional[str] = None
    date_column: Optional[str] = None

class ForecastRequest(BaseModel):
    data_id: str
    column: str
    periods: int = 12

# ============= API ENDPOINTS =============

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "3.0.0", "timestamp": datetime.now().isoformat()}

@app.post("/api/upload")
async def upload_data(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(StringIO(contents.decode('utf-8')))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
        
        data_id = base64.urlsafe_b64encode(f"{file.filename}_{datetime.now().timestamp()}".encode()).decode()[:16]
        data_store[data_id] = df
        
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        
        return {
            "data_id": data_id,
            "filename": file.filename,
            "rows": len(df),
            "columns": len(df.columns),
            "numeric_columns": numeric_cols,
            "categorical_columns": categorical_cols,
            "preview": df.head(10).to_dict('records')
        }
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/statistics/{data_id}")
async def get_statistics(data_id: str):
    if data_id not in data_store:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df = data_store[data_id]
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    
    if not numeric_cols:
        raise HTTPException(status_code=400, detail="No numeric columns found")
    
    desc_stats = df[numeric_cols].describe().T
    desc_stats['variance'] = df[numeric_cols].var()
    desc_stats['skewness'] = df[numeric_cols].skew()
    desc_stats['kurtosis'] = df[numeric_cols].kurtosis()
    
    box_data = []
    for col in numeric_cols[:5]:
        values = df[col].dropna().tolist()
        box_data.append({
            "name": col,
            "min": float(np.min(values)),
            "q1": float(np.percentile(values, 25)),
            "median": float(np.median(values)),
            "q3": float(np.percentile(values, 75)),
            "max": float(np.max(values)),
        })
    
    hist_col = numeric_cols[0]
    hist, bin_edges = np.histogram(df[hist_col].dropna(), bins=30)
    histogram_data = [
        {"bin": f"{bin_edges[i]:.2f}-{bin_edges[i+1]:.2f}", "count": int(hist[i])}
        for i in range(len(hist))
    ]
    
    return {
        "summary": desc_stats.reset_index().to_dict('records'),
        "box_plot_data": box_data,
        "histogram_data": {
            "column": hist_col,
            "data": histogram_data
        }
    }

# ============= BUSINESS INTELLIGENCE ENDPOINTS =============

@app.post("/api/business/kpis")
async def get_business_kpis(request: BusinessMetricsRequest):
    if request.data_id not in data_store:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df = data_store[request.data_id]
    
    revenue = float(df[request.revenue_column].sum())
    avg_order = float(df[request.revenue_column].mean())
    count = int(len(df))
    
    kpis = {
        "total_revenue": revenue,
        "average_order_value": avg_order,
        "total_transactions": count,
    }
    
    if request.cost_column and request.cost_column in df.columns:
        total_cost = float(df[request.cost_column].sum())
        profit = revenue - total_cost
        margin = (profit / revenue * 100) if revenue > 0 else 0
        kpis.update({
            "total_cost": total_cost,
            "net_profit": profit,
            "profit_margin_percent": margin
        })
        
    return kpis

@app.post("/api/business/forecast")
async def forecast_sales(request: ForecastRequest):
    if request.data_id not in data_store:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df = data_store[request.data_id]
    data = df[request.column].dropna().values
    
    if len(data) < 3:
        raise HTTPException(status_code=400, detail="Insufficient data for forecasting")
    
    # Simple Exponential Smoothing (Demo logic for investor)
    alpha = 0.3
    smoothed = [data[0]]
    for i in range(1, len(data)):
        smoothed.append(alpha * data[i] + (1 - alpha) * smoothed[-1])
    
    last_val = smoothed[-1]
    trend = (smoothed[-1] - smoothed[0]) / len(smoothed)
    forecast = [float(last_val + trend * (i + 1)) for i in range(request.periods)]
    
    return {
        "forecast": forecast,
        "periods": request.periods,
        "trend": "increasing" if trend > 0 else "decreasing",
        "confidence": 0.95
    }

# ============= HYPOTHESIS TESTING =============

@app.post("/api/hypothesis-test")
async def hypothesis_test(request: HypothesisTestRequest):
    if request.data_id not in data_store:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df = data_store[request.data_id]
    values = df[request.column].dropna()
    t_stat, p_value = stats.ttest_1samp(values, request.mu0)
    ci = stats.t.interval(1 - request.alpha, len(values) - 1, loc=values.mean(), scale=stats.sem(values))
    decision = "reject" if p_value < request.alpha else "fail_to_reject"
    
    return {
        "t_statistic": float(t_stat),
        "p_value": float(p_value),
        "sample_mean": float(values.mean()),
        "sample_size": int(len(values)),
        "confidence_interval": {"lower": float(ci[0]), "upper": float(ci[1])},
        "decision": decision,
        "interpretation": f"At α={request.alpha}, we {decision.replace('_', ' ')} H₀"
    }


# ============= REGRESSION ANALYSIS =============
@app.post("/api/regression")
async def run_regression(request: RegressionRequest):
    if request.data_id not in data_store:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df = data_store[request.data_id]
    
    if request.x_column not in df.columns or request.y_column not in df.columns:
        raise HTTPException(status_code=400, detail="Column not found")
    
    # Remove NaN values
    data = df[[request.x_column, request.y_column]].dropna()
    
    X = data[request.x_column].values
    y = data[request.y_column].values
    
    # Add constant for intercept
    X = sm.add_constant(X)
    
    # Fit OLS regression
    model = sm.OLS(y, X).fit()
    
    return {
        "r_squared": float(model.rsquared),
        "adj_r_squared": float(model.rsquared_adj),
        "f_statistic": float(model.fvalue),
        "p_value": float(model.f_pvalue),
        "coefficients": {
            "intercept": float(model.params[0]),
            "slope": float(model.params[1])
        },
        "std_errors": {
            "intercept": float(model.bse[0]),
            "slope": float(model.bse[1])
        }
    }

# ============= ANOVA ANALYSIS =============
@app.post("/api/anova")
async def run_anova(request: ANOVARequest):
    if request.data_id not in data_store:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df = data_store[request.data_id]
    
    if request.value_column not in df.columns or request.group_column not in df.columns:
        raise HTTPException(status_code=400, detail="Column not found")
    
    # Remove NaN values
    data = df[[request.value_column, request.group_column]].dropna()
    
    # Group data by group_column
    groups = [group_data[request.value_column].values for name, group_data in data.groupby(request.group_column)]
    
    # Perform one-way ANOVA
    f_stat, p_value = stats.f_oneway(*groups)
    
    # Calculate means for each group
    group_means = {}
    for name, group_data in data.groupby(request.group_column):
        group_means[str(name)] = float(group_data[request.value_column].mean())
    
    return {
        "f_statistic": float(f_stat),
        "p_value": float(p_value),
        "group_means": group_means,
        "num_groups": len(groups),
        "interpretation": "Significant difference between groups" if p_value < 0.05 else "No significant difference between groups"
    }

# ============= CORRELATION ANALYSIS =============
@app.get("/api/correlation/{data_id}")
async def get_correlation(data_id: str):
    if data_id not in data_store:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df = data_store[data_id]
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    
    if len(numeric_cols) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 numeric columns")
    
    # Calculate correlation matrix
    corr_matrix = df[numeric_cols].corr()
    
    # Convert to list format for visualization
    correlation_data = []
    for i, col1 in enumerate(numeric_cols):
        for j, col2 in enumerate(numeric_cols):
            if i < j:  # Only upper triangle to avoid duplicates
                correlation_data.append({
                    "col1": col1,
                    "col2": col2,
                    "correlation": float(corr_matrix.loc[col1, col2])
                })
    
    return {
        "correlation_matrix": corr_matrix.to_dict(),
        "correlation_pairs": correlation_data
    }

# ============= NORMALITY TEST =============
@app.post("/api/normality-test")
async def normality_test(request: NormalityTestRequest):
    if request.data_id not in data_store:
        raise HTTPException(status_code=404, detail="Data not found")
    
    df = data_store[request.data_id]
    values = df[request.column].dropna()
    
    if len(values) < 3:
        raise HTTPException(status_code=400, detail="Need at least 3 data points")
    
    # Shapiro-Wilk test
    stat, p_value = stats.shapiro(values)
    
    # Additional: Skewness and Kurtosis
    skewness = stats.skew(values)
    kurtosis = stats.kurtosis(values)
    
    return {
        "test_name": "Shapiro-Wilk Test",
        "statistic": float(stat),
        "p_value": float(p_value),
        "is_normal": bool(p_value > request.alpha),
        "skewness": float(skewness),
        "kurtosis": float(kurtosis),
        "interpretation": f"The data is {'normally' if p_value > request.alpha else 'not normally'} distributed (p={p_value:.4f})"
    }

# ============= STATIC FILE SERVING =============
static_path = os.path.join(os.getcwd(), "static")
if os.path.exists(static_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_path, "assets")), name="assets")

@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    index_file = os.path.join(static_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"error": "Frontend not built. Run: npm run build in frontend/"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
