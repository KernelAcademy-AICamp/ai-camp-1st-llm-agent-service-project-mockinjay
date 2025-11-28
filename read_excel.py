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

for row in ws.iter_rows(values_only=True):
    print(row)
