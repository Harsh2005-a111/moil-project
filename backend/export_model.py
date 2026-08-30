"""
Run this as the LAST cell in your Kaggle notebook (after training `model`,
`encoders`, and `label_names` from the pipeline you already built).

It saves three files into /kaggle/working/model/ — download them from the
Kaggle output panel and place them in backend/app/model/ before starting
the API.

    import joblib
    from pathlib import Path

    Path("model").mkdir(exist_ok=True)
    joblib.dump(model, "model/shortfall_model.pkl")
    joblib.dump(encoders, "model/encoders.pkl")
    joblib.dump(label_names, "model/label_names.pkl")

    print("Saved: model/shortfall_model.pkl, encoders.pkl, label_names.pkl")
    print("Download these from the Kaggle Output panel (top right, 'Output' tab).")
"""
