"""
Parlant Server Wrapper for Research Paper Agent
Runs the healthcare_v2_en.py Parlant server
"""

import sys
from pathlib import Path
import asyncio
import logging

# Add backend path
backend_path = Path(__file__).parent.parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

# Add server path for imports
server_path = Path(__file__).parent / "server"
if str(server_path) not in sys.path:
    sys.path.insert(0, str(server_path))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


async def start_server():
    """Start the Parlant healthcare server"""
    try:
        logger.info("=🚀 Starting Parlant Healthcare Server...")

        # Import and run the healthcare server
        # Try multiple import paths for flexibility
        try:
            # Try package-style import first
            from Agent.research_paper.server.healthcare_v2_en import main
        except ImportError:
            # Fallback to direct import (server path already added to sys.path)
            from healthcare_v2_en import main

        # Run the server
        await main()

    except Exception as e:
        logger.error(f"L Server startup failed: {e}", exc_info=True)
        raise


if __name__ == "__main__":
    """
    Run the Parlant server directly

    Usage:
        python backend/Agent/research_paper/run_server.py
    """
    print("\n" + "="*70)
    print("Research Paper Agent - Parlant Server")
    print("="*70)

    try:
        asyncio.run(start_server())
    except KeyboardInterrupt:
        print("\n\n=� Server stopped by user")
    except Exception as e:
        print(f"\nL Server error: {e}")
        sys.exit(1)