# Laptop Price Predictor

Estimate the resale price of a used laptop with on-device Random Forest inference.

## Overview
This web application is a React & TypeScript rewrite of the Android Laptop Price Predictor app. It runs full machine learning inference in the browser using the pre-trained Random Forest model (`rf_model.json`), preserving feature encoding, model structure, and prediction behavior.

## Features
- **Brand Selection**: HP, Dell, Lenovo, Asus, Acer, Apple, MSI, Other
- **Processor**: Intel i3/i5/i7/i9, AMD Ryzen 3/5/7, Other
- **Memory & Storage**: RAM (4 GB - 64 GB), Storage (128 GB - 2 TB), Storage Type (HDD, SSD, SSD + HDD)
- **Age & GPU**: Age input (0 to 10 years) with real-time numeric validation, dedicated graphics option
- **Condition**: Like New, Good, Fair, Poor
- **Instant Client-Side Inference**: 30-tree decision forest evaluated directly in-browser
- **Indian Rupee (₹) Currency Display**: Rounded to nearest 100 with locale formatting

## Development
```bash
npm install
npm run dev
```

Build for production:
```bash
npm run build
```
