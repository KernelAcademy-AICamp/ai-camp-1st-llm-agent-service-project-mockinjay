#!/usr/bin/env python3
import sys

try:
    import openpyxl
except ImportError:
    print("openpyxl not installed, trying to install...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl"])
    import openpyxl

wb = openpyxl.load_workbook('test.xlsx')
ws = wb.active

# Print only rows that have at least one non-None value
for idx, row in enumerate(ws.iter_rows(values_only=True), 1):
    if any(cell is not None for cell in row):
        print(f"Row {idx}: {row}")
