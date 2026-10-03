"""
RecallIQ churn model training + evaluation.

This uses the IBM Telco Customer Churn dataset when a local CSV is supplied.
Expected columns are the standard IBM dataset columns, including:
tenure, MonthlyCharges, TotalCharges, Contract, PaymentMethod,
InternetService, OnlineSecurity, TechSupport, Churn, etc.

Run:
  python train.py --data data/WA_Fn-UseC_-Telco-Customer-Churn.csv
"""

import argparse
import json
import os
import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

RANDOM_STATE = 42

NUMERIC = [
    "tenure", "MonthlyCharges", "TotalCharges",
    "SeniorCitizen", "Partner", "Dependents"
]

CATEGORICAL = [
    "gender", "PhoneService", "MultipleLines", "InternetService",
    "OnlineSecurity", "OnlineBackup", "DeviceProtection",
    "TechSupport", "StreamingTV", "StreamingMovies",
    "Contract", "PaperlessBilling", "PaymentMethod"
]

def clean(df):
    df=df.copy()
    df.columns=[c.strip() for c in df.columns]
    if "customerID" in df: df=df.drop(columns=["customerID"])
    if "TotalCharges" in df:
        df["TotalCharges"]=pd.to_numeric(df["TotalCharges"],errors="coerce")
    for c in ["SeniorCitizen","Partner","Dependents"]:
        if c in df:
            if df[c].dtype == object:
                df[c]=df[c].map({"Yes":1,"No":0,"Female":1,"Male":0}).fillna(0)
    df["Churn"]=df["Churn"].map({"Yes":1,"No":0}).astype(int)
    cols=[c for c in NUMERIC+CATEGORICAL if c in df.columns]
    return df[cols+["Churn"]]

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--data",required=True)
    ap.add_argument("--output",default="model_artifacts")
    args=ap.parse_args()

    df=clean(pd.read_csv(args.data))
    X=df.drop(columns=["Churn"]); y=df["Churn"]

    X_train,X_test,y_train,y_test=train_test_split(
        X,y,test_size=.20,stratify=y,random_state=RANDOM_STATE
    )

    nums=[c for c in NUMERIC if c in X.columns]
    cats=[c for c in CATEGORICAL if c in X.columns]

    pre=ColumnTransformer([
        ("num",Pipeline([
            ("imputer",SimpleImputer(strategy="median")),
            ("scale",StandardScaler())
        ]),nums),
        ("cat",Pipeline([
            ("imputer",SimpleImputer(strategy="most_frequent")),
            ("onehot",OneHotEncoder(handle_unknown="ignore"))
        ]),cats)
    ])

    pipe=Pipeline([
        ("preprocess",pre),
        ("model",LogisticRegression(max_iter=2000,class_weight="balanced",random_state=RANDOM_STATE))
    ])
    pipe.fit(X_train,y_train)

    pred=pipe.predict(X_test)
    prob=pipe.predict_proba(X_test)[:,1]
    cm=confusion_matrix(y_test,pred).tolist()

    metrics={
        "dataset_rows":int(len(df)),
        "test_rows":int(len(X_test)),
        "churn_rate":float(y.mean()),
        "accuracy":float(accuracy_score(y_test,pred)),
        "precision":float(precision_score(y_test,pred,zero_division=0)),
        "recall":float(recall_score(y_test,pred,zero_division=0)),
        "f1":float(f1_score(y_test,pred,zero_division=0)),
        "roc_auc":float(roc_auc_score(y_test,prob)),
        "confusion_matrix":cm,
        "classification_report":classification_report(y_test,pred,output_dict=True,zero_division=0)
    }

    os.makedirs(args.output,exist_ok=True)
    joblib.dump(pipe,os.path.join(args.output,"churn_model.joblib"))
    with open(os.path.join(args.output,"metrics.json"),"w") as f:
        json.dump(metrics,f,indent=2)

    print(json.dumps(metrics,indent=2))
    print("\nSaved:",os.path.join(args.output,"churn_model.joblib"))

if __name__=="__main__":
    main()
