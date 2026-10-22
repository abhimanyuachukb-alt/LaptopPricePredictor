"""Train a Random Forest on SYNTHETIC used-laptop data and export it for on-device inference.

No legally reusable real laptop dataset was available offline, so the training data is
synthetic (assumed price/depreciation process + noise). Predictions are illustrative,
not market-accurate. The model itself is a genuine scikit-learn RandomForestRegressor.
Run: python ml/train.py   (needs numpy, pandas, scikit-learn)
"""
import json, os
import numpy as np, pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "app", "src", "main", "assets", "rf_model.json")

# Single source of truth for options + feature order (exported into the JSON; the app reads it).
OPT = {
    "brand": ["HP", "Dell", "Lenovo", "Asus", "Acer", "Apple", "MSI", "Other"],
    "processor": ["Intel i3", "Intel i5", "Intel i7", "Intel i9", "AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7", "Other"],
    "ram": ["4 GB", "8 GB", "16 GB", "32 GB", "64 GB"],
    "storage": ["128 GB", "256 GB", "512 GB", "1 TB", "2 TB"],
    "storage_type": ["HDD", "SSD", "SSD + HDD"],
    "condition": ["Like New", "Good", "Fair", "Poor"],
    "gpu": ["No", "Yes"],
}
FEATURES = ["brand", "processor", "ram", "storage", "storage_type", "age", "condition", "gpu"]

# Assumptions used ONLY to generate synthetic training rows
BRAND = {"HP": 1.0, "Dell": 1.05, "Lenovo": 1.0, "Asus": 1.05, "Acer": 0.9, "Apple": 1.45, "MSI": 1.15, "Other": 0.85}
PROC = {"Intel i3": 22000, "Intel i5": 32000, "Intel i7": 45000, "Intel i9": 70000,
        "AMD Ryzen 3": 24000, "AMD Ryzen 5": 34000, "AMD Ryzen 7": 47000, "Other": 18000}
RAM = {"4 GB": 0, "8 GB": 4000, "16 GB": 10000, "32 GB": 20000, "64 GB": 38000}
STO = {"128 GB": 0, "256 GB": 2500, "512 GB": 6000, "1 TB": 10000, "2 TB": 18000}
STYPE = {"HDD": 0.9, "SSD": 1.0, "SSD + HDD": 1.04}
COND = {"Like New": 1.0, "Good": 0.88, "Fair": 0.74, "Poor": 0.55}


def generate(n=5000, seed=42):
    rng = np.random.default_rng(seed)
    df = pd.DataFrame({k: rng.choice(OPT[k], n) for k in ["brand", "processor", "ram", "storage", "storage_type", "condition"]})
    df["age"] = rng.integers(0, 11, n)
    df["gpu"] = rng.choice(OPT["gpu"], n, p=[0.7, 0.3])
    new = (df.processor.map(PROC) + df.ram.map(RAM) + df.storage.map(STO) + (df.gpu == "Yes") * 35000) \
        * df.brand.map(BRAND) * df.storage_type.map(STYPE)
    price = new * 0.82 ** df.age * df.condition.map(COND) * rng.lognormal(0, 0.08, n)
    df["price_inr"] = (np.maximum(price, 3000) / 500).round() * 500
    return df


def encode(df):
    return np.column_stack([df[f].astype(float) if f == "age" else df[f].map(OPT[f].index).astype(float)
                            for f in FEATURES])


def export_tree(est):
    t = est.tree_
    leaf = t.children_left == -1
    return {"f": [-1 if l else int(x) for l, x in zip(leaf, t.feature)],
            "t": [0 if l else round(float(x), 3) for l, x in zip(leaf, t.threshold)],
            "l": [int(x) for x in t.children_left], "r": [int(x) for x in t.children_right],
            "v": [int(round(float(x))) if l else 0 for l, x in zip(leaf, t.value[:, 0, 0])]}


def ref_predict(model, x):  # same traversal the Kotlin app performs
    tot = 0.0
    for tr in model["trees"]:
        n = 0
        while tr["f"][n] >= 0:
            n = tr["l"][n] if x[tr["f"][n]] <= tr["t"][n] else tr["r"][n]
        tot += tr["v"][n]
    return tot / len(model["trees"])


def encode_selection(model, sel, age):  # same encoding the Kotlin app performs
    return [float(age) if f == "age" else float(model["options"][f].index(sel[f])) for f in model["features"]]


if __name__ == "__main__":
    df = generate()
    df.to_csv(os.path.join(HERE, "laptops_synthetic.csv"), index=False)
    X, y = encode(df), df.price_inr.values
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)
    rf = RandomForestRegressor(n_estimators=30, max_depth=10, min_samples_leaf=10, random_state=42, n_jobs=-1).fit(Xtr, ytr)
    pred = rf.predict(Xte)
    r2, mae = float(r2_score(yte, pred)), float(mean_absolute_error(yte, pred))
    model = {"meta": {"algorithm": "RandomForestRegressor (scikit-learn)", "n_estimators": 30,
                      "data_source": "SYNTHETIC sample data (5000 rows), not real market data",
                      "test_r2": round(r2, 4), "test_mae_inr": round(mae)},
             "features": FEATURES, "options": OPT, "trees": [export_tree(e) for e in rf.estimators_]}
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(model, open(OUT, "w"), separators=(",", ":"))
    print(f"holdout R2={r2:.3f}  MAE=Rs {mae:,.0f}  json={os.path.getsize(OUT)/1024:.0f} KB")

    # Verify exported JSON (as the app will read it) reproduces sklearn
    loaded = json.load(open(OUT))
    diff = max(abs(ref_predict(loaded, x) - p) for x, p in zip(Xte, pred))
    print(f"max |JSON traversal - sklearn| over {len(Xte)} test rows: Rs {diff:.3f}")
    assert diff < 1.0
    base = {"brand": "Dell", "processor": "Intel i5", "ram": "8 GB", "storage": "512 GB",
            "storage_type": "SSD", "condition": "Good", "gpu": "No"}
    for name, ch, age in [("default", {}, 3), ("like new, age 0", {"condition": "Like New"}, 0),
                          ("poor, age 10", {"condition": "Poor"}, 10),
                          ("i7/16GB/GPU, age 2", {"processor": "Intel i7", "ram": "16 GB", "gpu": "Yes"}, 2),
                          ("Apple i5, age 3", {"brand": "Apple"}, 3)]:
        s = {**base, **ch}
        print(f"  {name:20s} -> Rs {ref_predict(loaded, encode_selection(loaded, s, age)):>9,.0f}")
