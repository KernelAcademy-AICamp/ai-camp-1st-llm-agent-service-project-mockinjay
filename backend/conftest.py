"""
Pytest configuration for backend tests
Add the backend directory to the Python path so `app` module can be imported
"""
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
