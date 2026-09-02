"""
03_train_classifier.py (V2 — Realistic Evaluation)
====================================================
Trains a regularized Random Forest with proper overfitting detection.

Overfitting checks performed:
  1. Train accuracy vs Test accuracy gap  (should be < 8%)
  2. 5-fold stratified cross-validation   (variance check)
  3. Learning curve                        (bias-variance tradeoff)
  4. Permutation importance               (stable feature ranking)

Model configuration (regularized to prevent memorization):
  - max_depth=6      (limits tree depth — prevents overfit)
  - min_samples_leaf=4 (requires 4+ samples per leaf)
  - max_features=0.6   (only 60% of features per split — adds variance)
  - n_estimators=150   (enough trees without overfit)
  - class_weight=balanced (handles class imbalance)

Expected realistic performance:
  Train AUC : 0.92-0.98  (slight gap from test = healthy)
  Test  AUC : 0.82-0.92  (not 1.00 — that would mean overfitting)
  CV AUC    : 0.80-0.90 +/- 0.05

Output:
  models/mn_classifier.pkl
  models/label_encoder.pkl
  outputs/evaluation_report.png   (full diagnostics)
  outputs/learning_curve.png      (bias-variance tradeoff)
"""

import pandas as pd
import numpy as np
import os
import joblib
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
import warnings
warnings.filterwarnings("ignore")

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import (
    train_test_split,
    StratifiedKFold,
    cross_val_score,
    learning_curve
)
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    roc_curve,
    ConfusionMatrixDisplay,
    accuracy_score
)
from sklearn.inspection import permutation_importance

os.makedirs("models",  exist_ok=True)
os.makedirs("outputs", exist_ok=True)


# ============================================================
# LOAD DATA
# ============================================================

print("=" * 60)
print("STEP 1: Loading final_dataset.csv (V2 — Robust)...")
print("=" * 60)

df = pd.read_csv("data/final_dataset.csv")
print(f"  Total samples    : {len(df)}")
print(f"  Positive (Mn=1)  : {df['has_manganese'].sum()}")
print(f"  Negative (Mn=0)  : {(df['has_manganese']==0).sum()}")
if "source" in df.columns:
    for src, cnt in df.groupby("source")["has_manganese"].count().items():
        print(f"    [{src}] : {cnt}")


# ============================================================
# FEATURE ENCODING
# ============================================================

print("\nSTEP 2: Encoding features...")

le = LabelEncoder()
df["rock_type_enc"] = le.fit_transform(df["rock_type"].fillna("Unknown"))

FEATURES = [
    "swir_b11_absorption",
    "swir_b12_absorption",
    "ndvi",
    "land_surface_temp_c",
    "rainfall_mm_weekly",
    "soil_moisture",
    "emag2_anomaly_nt",
    "elevation_m",
    "rock_type_enc",
]
TARGET = "has_manganese"

X = df[FEATURES].values
y = df[TARGET].values

print(f"  Features used    : {FEATURES}")
print(f"  Feature matrix   : {X.shape}")


# ============================================================
# TRAIN / TEST SPLIT  (stratified)
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.25, random_state=42, stratify=y
)

print(f"\n  Train size : {len(X_train)}  "
      f"(Mn+={y_train.sum()}, Mn-={(y_train==0).sum()})")
print(f"  Test size  : {len(X_test)}   "
      f"(Mn+={y_test.sum()}, Mn-={(y_test==0).sum()})")


# ============================================================
# MODEL — REGULARIZED RANDOM FOREST
# ============================================================

print("\nSTEP 3: Training regularized Random Forest...")
print("  (max_depth=6, min_samples_leaf=4 — prevents memorization)")

model = RandomForestClassifier(
    n_estimators=150,
    max_depth=6,           # Prevents deep memorizing trees
    min_samples_split=6,   # Requires 6+ samples to split
    min_samples_leaf=4,    # Requires 4+ samples per leaf
    max_features=0.6,      # Only 60% features per split (reduces overfit)
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)

model.fit(X_train, y_train)


# ============================================================
# TRAIN vs TEST ACCURACY GAP  (OVERFITTING CHECK)
# ============================================================

print("\n" + "=" * 60)
print("OVERFITTING DIAGNOSTIC")
print("=" * 60)

train_acc  = accuracy_score(y_train, model.predict(X_train))
test_acc   = accuracy_score(y_test,  model.predict(X_test))
train_auc  = roc_auc_score(y_train, model.predict_proba(X_train)[:, 1])
test_auc   = roc_auc_score(y_test,  model.predict_proba(X_test)[:, 1])

acc_gap = train_acc - test_acc
auc_gap = train_auc - test_auc

print(f"\n  Train Accuracy  : {train_acc*100:.1f}%")
print(f"  Test  Accuracy  : {test_acc*100:.1f}%")
print(f"  Accuracy Gap    : {acc_gap*100:.1f}%  ", end="")
if acc_gap < 0.05:
    print("(< 5%  — LOW OVERFIT, HEALTHY)")
elif acc_gap < 0.10:
    print("(< 10% — MODERATE, ACCEPTABLE)")
else:
    print("(> 10% — HIGH OVERFIT, NEEDS REGULARIZATION)")

print(f"\n  Train ROC-AUC   : {train_auc:.4f}")
print(f"  Test  ROC-AUC   : {test_auc:.4f}")
print(f"  AUC Gap         : {auc_gap:.4f}  ", end="")
if auc_gap < 0.05:
    print("(HEALTHY — model generalizes well)")
elif auc_gap < 0.12:
    print("(MODERATE — typical for small geological datasets)")
else:
    print("(HIGH OVERFIT)")


# ============================================================
# 5-FOLD STRATIFIED CROSS-VALIDATION
# ============================================================

print("\nSTEP 4: 5-Fold Stratified Cross-Validation...")

skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

cv_auc  = cross_val_score(model, X, y, cv=skf, scoring="roc_auc")
cv_acc  = cross_val_score(model, X, y, cv=skf, scoring="accuracy")
cv_f1   = cross_val_score(model, X, y, cv=skf, scoring="f1")
cv_prec = cross_val_score(model, X, y, cv=skf, scoring="precision")
cv_rec  = cross_val_score(model, X, y, cv=skf, scoring="recall")

print(f"\n  {'Metric':<18} {'Mean':>8}  {'Std':>8}  {'Min':>8}  {'Max':>8}")
print(f"  {'-'*60}")
print(f"  {'ROC-AUC':<18} {cv_auc.mean():>8.4f}  {cv_auc.std():>8.4f}  {cv_auc.min():>8.4f}  {cv_auc.max():>8.4f}")
print(f"  {'Accuracy':<18} {cv_acc.mean():>8.4f}  {cv_acc.std():>8.4f}  {cv_acc.min():>8.4f}  {cv_acc.max():>8.4f}")
print(f"  {'F1-Score':<18} {cv_f1.mean():>8.4f}  {cv_f1.std():>8.4f}  {cv_f1.min():>8.4f}  {cv_f1.max():>8.4f}")
print(f"  {'Precision':<18} {cv_prec.mean():>8.4f}  {cv_prec.std():>8.4f}  {cv_prec.min():>8.4f}  {cv_prec.max():>8.4f}")
print(f"  {'Recall':<18} {cv_rec.mean():>8.4f}  {cv_rec.std():>8.4f}  {cv_rec.min():>8.4f}  {cv_rec.max():>8.4f}")

if cv_auc.std() < 0.06:
    print("\n  Model is STABLE across folds (std < 0.06 = low variance)")
elif cv_auc.std() < 0.12:
    print("\n  Model has MODERATE variance (typical for small datasets)")
else:
    print("\n  Model is UNSTABLE — high fold-to-fold variance detected")


# ============================================================
# TEST SET CLASSIFICATION REPORT
# ============================================================

print("\nSTEP 5: Test Set Evaluation...")

y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

print(f"\n  Test Accuracy : {accuracy_score(y_test, y_pred)*100:.1f}%")
print(f"  Test ROC-AUC  : {roc_auc_score(y_test, y_prob):.4f}")
print("\n  Classification Report (on held-out 25% test set):")
print(classification_report(y_test, y_pred,
      target_names=["Barren (0)", "Manganese (1)"], digits=3))


# ============================================================
# FEATURE IMPORTANCE  (permutation — more reliable than impurity)
# ============================================================

print("STEP 6: Computing permutation feature importance...")

perm_imp = permutation_importance(
    model, X_test, y_test,
    n_repeats=20, random_state=42, n_jobs=-1
)

feat_imp_df = pd.DataFrame({
    "Feature":   [f.replace("_", " ").title() for f in FEATURES],
    "Importance": perm_imp.importances_mean,
    "Std":        perm_imp.importances_std,
}).sort_values("Importance", ascending=False)

print(f"\n  {'Feature':<30} {'Importance':>12}  {'Std':>8}")
print(f"  {'-'*54}")
for _, row in feat_imp_df.iterrows():
    bar = "#" * int(row["Importance"] * 80) if row["Importance"] > 0 else ""
    print(f"  {row['Feature']:<30} {row['Importance']:>12.4f}  {row['Std']:>8.4f}  {bar}")


# ============================================================
# LEARNING CURVE (bias-variance tradeoff)
# ============================================================

print("\nSTEP 7: Generating learning curve...")

train_sizes, train_scores, val_scores = learning_curve(
    model, X, y,
    train_sizes=np.linspace(0.20, 1.0, 8),
    cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=42),
    scoring="roc_auc",
    n_jobs=-1
)


# ============================================================
# PLOTS
# ============================================================

print("STEP 8: Generating evaluation plots...")

# --- FIGURE 1: Main Evaluation Dashboard ---
fig1 = plt.figure(figsize=(18, 5), facecolor="#FFFFFF")
gs   = gridspec.GridSpec(1, 3, figure=fig1, wspace=0.35)

# Confusion Matrix
ax1 = fig1.add_subplot(gs[0])
cm  = confusion_matrix(y_test, y_pred)
disp = ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=["Barren", "Manganese"]
)
disp.plot(ax=ax1, colorbar=False, cmap="Blues")
ax1.set_title(
    f"Confusion Matrix\nTest Accuracy: {test_acc*100:.1f}%",
    fontweight="bold", fontsize=12
)

# ROC Curve
ax2 = fig1.add_subplot(gs[1])
fpr, tpr, _ = roc_curve(y_test, y_prob)
ax2.plot(fpr, tpr, color="#185FA5", lw=2.5,
         label=f"Test AUC = {test_auc:.3f}")
ax2.fill_between(fpr, tpr, alpha=0.1, color="#185FA5")
ax2.axhline(y=cv_auc.mean(), color="#1D9E75", lw=1.5, linestyle="--",
            label=f"CV AUC = {cv_auc.mean():.3f} +/- {cv_auc.std():.3f}")
ax2.plot([0, 1], [0, 1], color="#CBD5E1", lw=1, linestyle=":")
ax2.set_xlabel("False Positive Rate")
ax2.set_ylabel("True Positive Rate")
ax2.set_title("ROC Curve\n(Solid=Test, Dashed=CV Mean)", fontweight="bold", fontsize=12)
ax2.legend(loc="lower right", fontsize=9)

# Permutation Feature Importance
ax3 = fig1.add_subplot(gs[2])
colors = ["#1D9E75" if v > 0.05 else
          "#F59E0B" if v > 0.01 else "#94A3B8"
          for v in feat_imp_df["Importance"]]
ax3.barh(
    feat_imp_df["Feature"].values[::-1],
    feat_imp_df["Importance"].values[::-1],
    xerr=feat_imp_df["Std"].values[::-1],
    color=colors[::-1], capsize=4
)
ax3.set_xlabel("Mean Accuracy Decrease (Permutation)")
ax3.set_title("Permutation Feature Importance\n(More reliable than Gini)", fontweight="bold", fontsize=12)
ax3.axvline(x=0.05, color="#E11D48", linestyle="--", lw=1, alpha=0.7, label=">0.05 = Strong")
ax3.axvline(x=0.01, color="#F59E0B", linestyle="--", lw=1, alpha=0.7, label=">0.01 = Moderate")
ax3.legend(fontsize=8)

fig1.suptitle(
    f"Manganese Reserve Classifier — V2 Evaluation\n"
    f"Train AUC: {train_auc:.3f} | Test AUC: {test_auc:.3f} | "
    f"Gap: {auc_gap:.3f} | CV: {cv_auc.mean():.3f}+/-{cv_auc.std():.3f}",
    fontsize=13, fontweight="bold", y=1.02
)
plt.savefig("outputs/evaluation_report.png", dpi=150, bbox_inches="tight")
print("  Saved: outputs/evaluation_report.png")

# --- FIGURE 2: Learning Curve ---
fig2, ax = plt.subplots(figsize=(9, 5))

train_mean = train_scores.mean(axis=1)
train_std  = train_scores.std(axis=1)
val_mean   = val_scores.mean(axis=1)
val_std    = val_scores.std(axis=1)

ax.plot(train_sizes, train_mean, "o-", color="#185FA5", lw=2, label="Training AUC")
ax.fill_between(train_sizes, train_mean - train_std, train_mean + train_std,
                alpha=0.15, color="#185FA5")
ax.plot(train_sizes, val_mean, "s--", color="#1D9E75", lw=2, label="Validation AUC (CV)")
ax.fill_between(train_sizes, val_mean - val_std, val_mean + val_std,
                alpha=0.15, color="#1D9E75")

gap_at_full = train_mean[-1] - val_mean[-1]
ax.annotate(
    f"Gap at full data: {gap_at_full:.3f}",
    xy=(train_sizes[-1], (train_mean[-1] + val_mean[-1]) / 2),
    xytext=(-80, 10), textcoords="offset points",
    fontsize=9, color="#94A3B8",
    arrowprops=dict(arrowstyle="->", color="#94A3B8", lw=1)
)

ax.set_xlabel("Training Set Size", fontsize=11)
ax.set_ylabel("ROC-AUC Score", fontsize=11)
ax.set_ylim(0.40, 1.05)
ax.set_title(
    "Learning Curve — Bias vs Variance Tradeoff\n"
    "(Converging curves = good generalization, "
    "Diverging = overfit)",
    fontsize=12, fontweight="bold"
)
ax.legend(fontsize=10)
ax.grid(alpha=0.3)
plt.tight_layout()
plt.savefig("outputs/learning_curve.png", dpi=150, bbox_inches="tight")
print("  Saved: outputs/learning_curve.png")


# ============================================================
# SAVE MODEL
# ============================================================

print("\nSTEP 9: Saving model artifacts...")

joblib.dump(model, "models/mn_classifier.pkl")
joblib.dump(le,    "models/label_encoder.pkl")

# Save feature importance for reference
feat_imp_df.to_csv("outputs/feature_importance.csv", index=False)

print("  Saved: models/mn_classifier.pkl")
print("  Saved: models/label_encoder.pkl")
print("  Saved: outputs/feature_importance.csv")

print(f"\n{'='*60}")
print("FINAL MODEL SUMMARY")
print(f"{'='*60}")
print(f"  Algorithm       : Random Forest (Regularized)")
print(f"  n_estimators    : 150")
print(f"  max_depth       : 6  (prevents deep memorization)")
print(f"  min_samples_leaf: 4  (minimum leaf size)")
print(f"  max_features    : 0.6 (feature subsampling)")
print(f"  Features used   : {len(FEATURES)}")
print(f"  Training samples: {len(X_train)}")
print(f"  Test samples    : {len(X_test)}")
print(f"")
print(f"  Train Accuracy  : {train_acc*100:.1f}%")
print(f"  Test  Accuracy  : {test_acc*100:.1f}%  <-- reported metric")
print(f"  Accuracy Gap    : {acc_gap*100:.1f}%")
print(f"  Train AUC       : {train_auc:.4f}")
print(f"  Test  AUC       : {test_auc:.4f}  <-- primary metric")
print(f"  AUC Gap         : {auc_gap:.4f}")
print(f"  CV AUC (5-fold) : {cv_auc.mean():.4f} +/- {cv_auc.std():.4f}")
print(f"{'='*60}")
print("\nDONE. Training complete! Run 04_predict_new_location.py to predict a new site.")
print(f"{'='*60}")
