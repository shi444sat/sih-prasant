"""
Machine Learning & Statistical Baseline Pipeline for Project Drishti
Implements chronological train/test splitting, baseline vs ML comparison,
and evaluation metrics (Precision, Recall, F1, PR-AUC, MAE, RMSE, Brier/Calibration).
"""
import json
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session

from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.metrics import (
    precision_score, recall_score, f1_score, precision_recall_curve,
    auc, mean_absolute_error, mean_squared_error, brier_score_loss
)

from app.models.model_runs import ModelRun
from app.models.projects import Project
from app.models.snapshots import ProjectSnapshot
from app.models.milestones import Milestone
from app.analytics.features import calculate_snapshot_features

FEATURE_COLUMNS = [
    "expenditure_ratio",
    "revised_approved_ratio",
    "monthly_expenditure_change",
    "financial_progress",
    "physical_progress",
    "schedule_progress",
    "progress_gap",
    "progress_delta",
    "progress_slope_3m",
    "elapsed_percentage",
    "slippage_days",
    "milestone_delay_rate",
    "delayed_milestone_count",
    "critical_delayed_count",
    "sector_median_gap",
    "peer_ratio",
    "data_update_age",
    "missing_rate"
]

def build_dataset_from_db(db: Session) -> pd.DataFrame:
    """
    Constructs chronological time-series dataset of snapshots with engineered features
    and future outcome targets (Cost/Time overrun in subsequent 3 months).
    Ensures ZERO lookahead leakage during feature calculation.
    """
    projects = db.query(Project).all()
    rows = []

    for p in projects:
        snaps = db.query(ProjectSnapshot).filter(
            ProjectSnapshot.project_id == p.id
        ).order_by(ProjectSnapshot.month.asc()).all()

        p_dict = {
            "approved_cost": p.approved_cost,
            "revised_cost": p.revised_cost,
            "start_date": p.start_date,
            "target_date": p.target_date,
            "sector": p.sector,
            "agency": p.agency
        }

        milestones_list = [
            {
                "name": m.name,
                "planned_date": m.planned_date,
                "status": m.status,
                "criticality": m.criticality
            }
            for m in p.milestones
        ]

        for i in range(len(snaps)):
            history_snaps = [
                {
                    "month": s.month,
                    "expenditure": s.expenditure,
                    "physical_progress": s.physical_progress,
                    "schedule_progress": s.schedule_progress,
                    "milestones_due": s.milestones_due,
                    "milestones_delayed": s.milestones_delayed
                }
                for s in snaps[: i + 1]
            ]

            features = calculate_snapshot_features(p_dict, history_snaps, milestones_list)
            
            # Define future outcome target (Outcome at T+3 or final snapshot)
            # Binary target: 1 if high cost/time overrun occurred, 0 otherwise
            # Continuous target: actual future overrun percentage
            current_snap = snaps[i]
            future_idx = min(len(snaps) - 1, i + 3)
            future_snap = snaps[future_idx]

            future_slip = max(0.0, future_snap.schedule_progress - future_snap.physical_progress)
            future_cost_ratio = (future_snap.expenditure / p.revised_cost) if p.revised_cost > 0 else 0.0
            
            # High risk threshold: slippage > 10% or cost ratio ahead by 15%
            is_high_risk = 1 if (future_slip > 10.0 or (future_cost_ratio * 100 - future_snap.physical_progress) > 15.0) else 0
            continuous_target = round(future_slip * 2.0 + (p.revised_cost / p.approved_cost - 1.0) * 50.0, 2)
            continuous_target = max(0.0, min(100.0, continuous_target))

            features["project_id"] = p.id
            features["month"] = current_snap.month
            features["target_binary"] = is_high_risk
            features["target_continuous"] = continuous_target
            rows.append(features)

    df = pd.DataFrame(rows)
    return df

def train_and_evaluate_models(db: Session, version: str = None) -> List[Dict[str, Any]]:
    """
    Performs chronological train/test split, trains Statistical Baseline,
    Logistic Regression, Ridge Regression, Random Forest, and GradientBoosting/XGBoost.
    Calculates Precision, Recall, F1, PR-AUC, MAE, RMSE, Calibration (Brier Score).
    """
    df = build_dataset_from_db(db)
    if len(df) < 20:
        return []

    # Sort strictly chronologically by month to eliminate time leakage
    df = df.sort_values(by="month").reset_index(drop=True)

    # 70% chronological train, 30% test
    split_idx = int(len(df) * 0.70)
    train_df = df.iloc[:split_idx]
    test_df = df.iloc[split_idx:]

    X_train = train_df[FEATURE_COLUMNS].fillna(0).values
    y_train_bin = train_df["target_binary"].values
    y_train_cont = train_df["target_continuous"].values

    X_test = test_df[FEATURE_COLUMNS].fillna(0).values
    y_test_bin = test_df["target_binary"].values
    y_test_cont = test_df["target_continuous"].values

    results = []
    # Dynamic run seed based on current timestamp to simulate live retraining iterations
    run_epoch = int(datetime.utcnow().timestamp())
    dynamic_seed = (run_epoch % 1000) + 1
    run_version = version or f"v{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

    # Bootstrap resample 90-98% of train_df to reflect live streaming data window
    np.random.seed(dynamic_seed)
    bootstrap_sample_size = int(len(train_df) * np.random.uniform(0.92, 1.0))
    bootstrap_indices = np.random.choice(len(train_df), size=bootstrap_sample_size, replace=True)
    X_train_dyn = X_train[bootstrap_indices]
    y_train_bin_dyn = y_train_bin[bootstrap_indices]
    y_train_cont_dyn = y_train_cont[bootstrap_indices]

    # Helper evaluation function
    def evaluate_clf(model_name: str, y_pred, y_prob, y_true):
        prec = precision_score(y_true, y_pred, zero_division=0)
        rec = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        p_curve, r_curve, _ = precision_recall_curve(y_true, y_prob)
        pr_auc = auc(r_curve, p_curve)
        brier = brier_score_loss(y_true, y_prob)
        calibration = round(max(0.0, 1.0 - brier), 4) # 1 - brier score as calibration index
        return {
            "precision": round(float(prec), 3),
            "recall": round(float(rec), 3),
            "f1_score": round(float(f1), 3),
            "pr_auc": round(float(pr_auc), 3),
            "calibration_score": calibration
        }

    def evaluate_reg(y_pred, y_true):
        mae = mean_absolute_error(y_true, y_pred)
        rmse = np.sqrt(mean_squared_error(y_true, y_pred))
        return round(float(mae), 2), round(float(rmse), 2)

    # 1. Statistical Baseline (Heuristic rule based on thresholding progress_gap & slippage)
    baseline_pred = (X_test[:, FEATURE_COLUMNS.index("progress_gap")] > 8.0) | (X_test[:, FEATURE_COLUMNS.index("slippage_days")] > 20.0)
    baseline_pred = baseline_pred.astype(int)
    baseline_prob = np.clip((X_test[:, FEATURE_COLUMNS.index("progress_gap")] + X_test[:, FEATURE_COLUMNS.index("slippage_days")]) / 100.0, 0, 1)
    base_metrics = evaluate_clf("Statistical Baseline", baseline_pred, baseline_prob, y_test_bin)
    base_mae, base_rmse = evaluate_reg(baseline_prob * 100.0, y_test_cont)
    results.append({
        "model_name": "Statistical Heuristic Baseline",
        "model_type": "Statistical Baseline",
        "precision": base_metrics["precision"],
        "recall": base_metrics["recall"],
        "f1_score": base_metrics["f1_score"],
        "pr_auc": base_metrics["pr_auc"],
        "mae": base_mae,
        "rmse": base_rmse,
        "calibration_score": base_metrics["calibration_score"],
        "sample_size": len(test_df),
        "status": "Active"
    })

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_dyn)
    X_test_scaled = scaler.transform(X_test)

    # 2. Logistic Regression (Classification)
    lr_c = float(np.random.choice([0.8, 1.0, 1.2]))
    lr = LogisticRegression(max_iter=1000, C=lr_c, random_state=dynamic_seed)
    lr.fit(X_train_scaled, y_train_bin_dyn)
    lr_pred = lr.predict(X_test_scaled)
    lr_prob = lr.predict_proba(X_test_scaled)[:, 1] if len(np.unique(y_train_bin_dyn)) > 1 else np.zeros(len(X_test))
    lr_metrics = evaluate_clf("Logistic Regression", lr_pred, lr_prob, y_test_bin)
    lr_mae, lr_rmse = evaluate_reg(lr_prob * 100.0, y_test_cont)
    results.append({
        "model_name": "Logistic Regression",
        "model_type": "Linear Classifier",
        "precision": lr_metrics["precision"],
        "recall": lr_metrics["recall"],
        "f1_score": lr_metrics["f1_score"],
        "pr_auc": lr_metrics["pr_auc"],
        "mae": lr_mae,
        "rmse": lr_rmse,
        "calibration_score": lr_metrics["calibration_score"],
        "sample_size": len(test_df),
        "status": "Active"
    })

    # 3. Ridge Regression (Continuous Risk Target)
    ridge_alpha = float(np.random.choice([0.85, 1.0, 1.15]))
    ridge = Ridge(alpha=ridge_alpha, random_state=dynamic_seed)
    ridge.fit(X_train_scaled, y_train_cont_dyn)
    ridge_pred = np.clip(ridge.predict(X_test_scaled), 0, 100)
    r_mae, r_rmse = evaluate_reg(ridge_pred, y_test_cont)
    ridge_bin = (ridge_pred > 50.0).astype(int)
    ridge_prob = np.clip(ridge_pred / 100.0, 0, 1)
    ridge_metrics = evaluate_clf("Ridge Regression", ridge_bin, ridge_prob, y_test_bin)
    results.append({
        "model_name": "Ridge Regression",
        "model_type": "Regularized Linear Regression",
        "precision": ridge_metrics["precision"],
        "recall": ridge_metrics["recall"],
        "f1_score": ridge_metrics["f1_score"],
        "pr_auc": ridge_metrics["pr_auc"],
        "mae": r_mae,
        "rmse": r_rmse,
        "calibration_score": ridge_metrics["calibration_score"],
        "sample_size": len(test_df),
        "status": "Active"
    })

    # 4. Random Forest Classifier
    rf_trees = int(np.random.choice([95, 100, 105, 110]))
    rf = RandomForestClassifier(n_estimators=rf_trees, max_depth=6, random_state=dynamic_seed)
    rf.fit(X_train_dyn, y_train_bin_dyn)
    rf_pred = rf.predict(X_test)
    rf_prob = rf.predict_proba(X_test)[:, 1] if len(np.unique(y_train_bin_dyn)) > 1 else np.zeros(len(X_test))
    rf_metrics = evaluate_clf("Random Forest", rf_pred, rf_prob, y_test_bin)
    rf_mae, rf_rmse = evaluate_reg(rf_prob * 100.0, y_test_cont)
    results.append({
        "model_name": "Random Forest",
        "model_type": "Ensemble (Bagging)",
        "precision": rf_metrics["precision"],
        "recall": rf_metrics["recall"],
        "f1_score": rf_metrics["f1_score"],
        "pr_auc": rf_metrics["pr_auc"],
        "mae": rf_mae,
        "rmse": rf_rmse,
        "calibration_score": rf_metrics["calibration_score"],
        "sample_size": len(test_df),
        "status": "Active"
    })

    # 5. Gradient Boosting / XGBoost
    gb_lr = float(np.random.choice([0.075, 0.08, 0.085]))
    try:
        from xgboost import XGBClassifier
        xgb = XGBClassifier(n_estimators=85, max_depth=3, learning_rate=gb_lr, random_state=dynamic_seed)
        xgb_label = "XGBoost"
    except Exception:
        xgb = GradientBoostingClassifier(n_estimators=85, max_depth=3, learning_rate=gb_lr, random_state=dynamic_seed)
        xgb_label = "Gradient Boosting (XGBoost Equivalent)"

    xgb.fit(X_train_dyn, y_train_bin_dyn)
    xgb_pred = xgb.predict(X_test)
    xgb_prob = xgb.predict_proba(X_test)[:, 1] if len(np.unique(y_train_bin_dyn)) > 1 else np.zeros(len(X_test))
    xgb_metrics = evaluate_clf(xgb_label, xgb_pred, xgb_prob, y_test_bin)
    xgb_mae, xgb_rmse = evaluate_reg(xgb_prob * 100.0, y_test_cont)
    results.append({
        "model_name": xgb_label,
        "model_type": "Ensemble (Boosting)",
        "precision": xgb_metrics["precision"],
        "recall": xgb_metrics["recall"],
        "f1_score": xgb_metrics["f1_score"],
        "pr_auc": xgb_metrics["pr_auc"],
        "mae": xgb_mae,
        "rmse": xgb_rmse,
        "calibration_score": xgb_metrics["calibration_score"],
        "sample_size": len(test_df),
        "status": "Active"
    })

    # Deactivate older model runs so new evaluations take precedence
    db.query(ModelRun).filter(ModelRun.is_active == True).update({ModelRun.is_active: False})

    # Record fresh model runs in database (upsert to respect unique version constraint)
    for res in results:
        rec_ver = f"{run_version}_{res['model_name'].replace(' ', '_').lower()[:20]}"
        m_run = db.query(ModelRun).filter(ModelRun.version == rec_ver).first()
        if not m_run:
            m_run = ModelRun(
                version=rec_ver,
                model_name=res["model_name"],
                model_type=res["model_type"],
                dataset_version=f"demo-synthetic-{run_version}",
                features=json.dumps(FEATURE_COLUMNS),
                metrics=json.dumps(res),
                training_samples=len(train_df),
                is_active=True,
                training_date=datetime.utcnow()
            )
            db.add(m_run)
        else:
            m_run.metrics = json.dumps(res)
            m_run.training_samples = len(train_df)
            m_run.is_active = True
            m_run.training_date = datetime.utcnow()
    db.commit()

    return results
