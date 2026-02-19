from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
import pandas as pd
import numpy as np
from scipy import stats
import statsmodels.api as sm
from io import BytesIO, StringIO
from typing import Dict, List, Any, Optional
from pydantic import BaseModel
import base64
import os
from sklearn.impute import SimpleImputer, KNNImputer
from sklearn.preprocessing import StandardScaler, MinMaxScaler

# ✅ FIX 1: Added missing closing parenthesis
app = FastAPI(
    title="StatAnalyzer Pro API",
    description="Enterprise Statistical Analysis API",
    version="2.0.0"
)

# ✅ FIX 2: Added missing closing parenthesis
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data storage (in production, use Redis or database)
data_store = {}

# Pydantic models
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

# Data Cleaning Models
class DataCleaningRequest(BaseModel):
    data_id: str
    operation: str  # 'drop_missing', 'fill_mean', 'fill_median', 'fill_mode', 'knn_impute'
    columns: Optional[List[str]] = None  # If None, apply to all numeric columns

class OutlierRemovalRequest(BaseModel):
    data_id: str
    method: str  # 'iqr', 'zscore'
    columns: List[str]
    threshold: Optional[float] = None  # For z-score method (default 3)

class ScalingRequest(BaseModel):
    data_id: str
    method: str  # 'standard', 'minmax'
    columns: List[str]


# API endpoints

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "2.0.0"}


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

        data_id = base64.urlsafe_b64encode(file.filename.encode()).decode()[:16]
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
        "sample_std": float(values.std()),
        "sample_size": int(len(values)),
        "confidence_interval": {
            "lower": float(ci[0]),
            "upper": float(ci[1]),
            "level": 1 - request.alpha
        },
        "decision": decision,
        "interpretation": f"At α={request.alpha}, we {decision.replace('_', ' ')} H₀"
    }


@app.post("/api/regression")
async def regression_analysis(request: RegressionRequest):
    if request.data_id not in data_store:
        raise HTTPException(status_code=404, detail="Data not found")

    df = data_store[request.data_id]
    clean_df = df[[request.y_column, request.x_column]].dropna()
    X = sm.add_constant(clean_df[request.x_column])
    y = clean_df[request.y_column]
    model = sm.OLS(y, X).fit()

    scatter_data = [{"x": float(x), "y": float(yv)} for x, yv in zip(clean_df[request.x_column], clean_df[request.y_column])]
    x_range = np.linspace(clean_df[request.x_column].min(), clean_df[request.x_column].max(), 100)
    y_pred = model.params.iloc[0] + model.params.iloc[1] * x_range
    regression_line = [{"x": float(x), "y": float(yv)} for x, yv in zip(x_range, y_pred)]

    residuals = model.resid
    fitted = model.fittedvalues
    residual_data = [{"fitted": float(f), "residual": float(r)} for f, r in zip(fitted, residuals)]

    return {
        "model_stats": {
            "r_squared": float(model.rsquared),
            "adj_r_squared": float(model.rsquared_adj),
            "f_statistic": float(model.fvalue),
            "p_value": float(model.f_pvalue),
            "intercept": float(model.params.iloc[0]),
            "slope": float(model.params.iloc[1])
        },
        "equation": f"y = {model.params.iloc[0]:.4f} + {model.params.iloc[1]:.4f}x",
        "scatter_data": scatter_data,
        "regression_line": regression_line,
        "residual_data": residual_data
    }


@app.post("/api/anova")
async def anova_analysis(request: ANOVARequest):
    if request.data_id not in data_store:
        raise HTTPException(status_code=404, detail="Data not found")

    df = data_store[request.data_id]
    clean_df = df[[request.value_column, request.group_column]].dropna()
    groups = clean_df[request.group_column].unique()
    group_data = [clean_df[clean_df[request.group_column] == g][request.value_column].values for g in groups]
    f_stat, p_value = stats.f_oneway(*group_data)

    group_stats = clean_df.groupby(request.group_column)[request.value_column].agg(
        count='count', mean='mean', std='std', min='min', max='max'
    ).reset_index().to_dict('records')

    box_data = []
    for group in groups:
        values = clean_df[clean_df[request.group_column] == group][request.value_column].dropna()
        box_data.append({
            "group": str(group),
            "min": float(values.min()),
            "q1": float(values.quantile(0.25)),
            "median": float(values.median()),
            "q3": float(values.quantile(0.75)),
            "max": float(values.max())
        })

    return {
        "f_statistic": float(f_stat),
        "p_value": float(p_value),
        "num_groups": len(groups),
        "decision": "significant" if p_value < 0.05 else "not_significant",
        "group_statistics": group_stats,
        "box_plot_data": box_data
    }


@app.get("/api/correlation/{data_id}")
async def correlation_analysis(data_id: str):
    if data_id not in data_store:
        raise HTTPException(status_code=404, detail="Data not found")

    df = data_store[data_id]
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    if len(numeric_cols) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 numeric columns")

    corr_matrix = df[numeric_cols].corr()
    heatmap_data = []
    for i, row in enumerate(corr_matrix.index):
        for j, col in enumerate(corr_matrix.columns):
            heatmap_data.append({
                "x": col,
                "y": row,
                "value": float(corr_matrix.iloc[i, j])
            })

    return {
        "correlation_matrix": corr_matrix.to_dict(),
        "heatmap_data": heatmap_data,
        "columns": numeric_cols
    }


@app.post("/api/normality-test")
async def normality_test(request: NormalityTestRequest):
    if request.data_id not in data_store:
        raise HTTPException(status_code=404, detail="Data not found")

    df = data_store[request.data_id]
    values = df[request.column].dropna()

    # ✅ FIX 3: Shapiro-Wilk crashes for n > 5000 — sample if needed
    shapiro_values = values.sample(5000, random_state=42) if len(values) > 5000 else values
    shapiro_stat, shapiro_p = stats.shapiro(shapiro_values)

    ks_stat, ks_p = stats.kstest(values, 'norm', args=(values.mean(), values.std()))
    anderson_result = stats.anderson(values, dist='norm')

    from scipy.stats import probplot
    qq_data = probplot(values, dist="norm")
    qq_plot = [
        {"theoretical": float(qq_data[0][0][i]), "sample": float(qq_data[0][1][i])}
        for i in range(len(qq_data[0][0]))
    ]

    hist, bin_edges = np.histogram(values, bins=30, density=True)
    histogram = [{"bin": f"{bin_edges[i]:.2f}", "frequency": float(hist[i])} for i in range(len(hist))]

    x_range = np.linspace(values.min(), values.max(), 100)
    normal_curve = [{"x": float(x), "y": float(stats.norm.pdf(x, values.mean(), values.std()))} for x in x_range]

    # ✅ FIX 4: Removed stray {...  in kolmogorov_smirnov dict
    return {
        "tests": {
            "shapiro_wilk": {
                "statistic": float(shapiro_stat),
                "p_value": float(shapiro_p),
                "result": "normal" if shapiro_p > request.alpha else "not_normal"
            },
            "kolmogorov_smirnov": {
                "statistic": float(ks_stat),
                "p_value": float(ks_p),
                "result": "normal" if ks_p > request.alpha else "not_normal"
            },
            "anderson_darling": {
                "statistic": float(anderson_result.statistic),
                "critical_values": anderson_result.critical_values.tolist()
            }
        },
        "qq_plot_data": qq_plot,
        "histogram_data": histogram,
        "normal_curve_data": normal_curve
    }


@app.post("/api/clean-missing")
async def clean_missing_values(request: DataCleaningRequest):
    if request.data_id not in data_store:
        raise HTTPException(status_code=404, detail="Data not found")

    df = data_store[request.data_id].copy()
    original_shape = df.shape

    if request.columns:
        cols_to_clean = request.columns
    else:
        cols_to_clean = df.select_dtypes(include=[np.number]).columns.tolist()

    if request.operation == 'drop_missing':
        df = df.dropna(subset=cols_to_clean)
        rows_removed = original_shape[0] - df.shape[0]
        message = f"Removed {rows_removed} rows with missing values"

    elif request.operation == 'fill_mean':
        # ✅ FIX 5: Replaced deprecated fillna(inplace=True) with assignment
        for col in cols_to_clean:
            if col in df.columns and df[col].dtype in ['float64', 'int64']:
                df[col] = df[col].fillna(df[col].mean())
        message = "Filled missing values with column means"

    elif request.operation == 'fill_median':
        for col in cols_to_clean:
            if col in df.columns and df[col].dtype in ['float64', 'int64']:
                df[col] = df[col].fillna(df[col].median())
        message = "Filled missing values with column medians"

    elif request.operation == 'fill_mode':
        for col in cols_to_clean:
            if col in df.columns:
                mode_val = df[col].mode()[0] if not df[col].mode().empty else 0
                df[col] = df[col].fillna(mode_val)
        message = "Filled missing values with column modes"

    elif request.operation == 'knn_impute':
        numeric_cols = df[cols_to_clean].select_dtypes(include=[np.number]).columns.tolist()
        if numeric_cols:
            imputer = KNNImputer(n_neighbors=5)
            df[numeric_cols] = imputer.fit_transform(df[numeric_cols])
            message = "Filled missing values using KNN imputation"
        else:
            raise HTTPException(status_code=400, detail="No numeric columns to impute")
    else:
        raise HTTPException(status_code=400, detail="Invalid operation")

    cleaned_id = f"{request.data_id}_cleaned_{request.operation}"
    data_store[cleaned_id] = df

    missing_before = original_shape[0] - data_store[request.data_id].dropna().shape[0]
    missing_after = df.shape[0] - df.dropna().shape[0]

    return {
        "message": message,
        "new_data_id": cleaned_id,
        "original_shape": original_shape,
        "new_shape": df.shape,
        "missing_values_before": int(missing_before),
        "missing_values_after": int(missing_after),
        "preview": df.head(5).to_dict('records')
    }


@app.post("/api/remove-outliers")
async def remove_outliers(request: OutlierRemovalRequest):
    if request.data_id not in data_store:
        raise HTTPException(status_code=404, detail="Data not found")

    df = data_store[request.data_id].copy()
    original_shape = df.shape
    outliers_removed = 0

    if request.method == 'iqr':
        for col in request.columns:
            if col not in df.columns:
                continue
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            before_count = len(df)
            df = df[(df[col] >= lower_bound) & (df[col] <= upper_bound)]
            outliers_removed += before_count - len(df)

    elif request.method == 'zscore':
        threshold = request.threshold or 3
        for col in request.columns:
            if col not in df.columns:
                continue
            z_scores = np.abs((df[col] - df[col].mean()) / df[col].std())
            before_count = len(df)
            df = df[z_scores < threshold]
            outliers_removed += before_count - len(df)
    else:
        raise HTTPException(status_code=400, detail="Invalid method")

    cleaned_id = f"{request.data_id}_no_outliers"
    data_store[cleaned_id] = df

    return {
        "message": f"Removed {outliers_removed} outliers using {request.method} method",
        "new_data_id": cleaned_id,
        "original_shape": original_shape,
        "new_shape": df.shape,
        "outliers_removed": int(outliers_removed),
        "preview": df.head(5).to_dict('records')
    }


@app.post("/api/scale-data")
async def scale_data(request: ScalingRequest):
    if request.data_id not in data_store:
        raise HTTPException(status_code=404, detail="Data not found")

    df = data_store[request.data_id].copy()

    if request.method == 'standard':
        scaler = StandardScaler()
        method_name = "Standardization (mean=0, std=1)"
    elif request.method == 'minmax':
        scaler = MinMaxScaler()
        method_name = "Min-Max Scaling (range 0-1)"
    else:
        raise HTTPException(status_code=400, detail="Invalid scaling method")

    df[request.columns] = scaler.fit_transform(df[request.columns])

    scaled_id = f"{request.data_id}_scaled_{request.method}"
    data_store[scaled_id] = df

    return {
        "message": f"Applied {method_name}",
        "new_data_id": scaled_id,
        "scaled_columns": request.columns,
        "preview": df.head(5).to_dict('records')
    }


@app.get("/api/data-preview/{data_id}")
async def get_data_preview(data_id: str, rows: int = 10):
    if data_id not in data_store:
        raise HTTPException(status_code=404, detail="Data not found")

    df = data_store[data_id]
    missing_values = df.isnull().sum().to_dict()
    dtypes = df.dtypes.astype(str).to_dict()

    return {
        "shape": df.shape,
        "columns": df.columns.tolist(),
        "dtypes": dtypes,
        "missing_values": missing_values,
        "preview": df.head(rows).to_dict('records'),
        "summary_stats": df.describe().to_dict()
    }


# ===== STATIC FILE SERVING =====
static_path = os.path.join(os.getcwd(), "static")

if os.path.exists(static_path):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_path, "assets")), name="assets")

@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    """Serve React SPA for all non-API routes"""
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    index_file = os.path.join(static_path, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    else:
        return {"error": "Frontend not built. Run: npm run build in frontend/"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
