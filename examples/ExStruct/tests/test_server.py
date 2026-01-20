import asyncio
import os
import sys

# Add the server directory to path so we can import it if needed, or we just run it via subprocess
# But testing via importing the FastMCP instance is easier for unit tests if exposed.
# However, FastMCP is designed to be run.
# Let's try to verify the `read_excel` function directly by importing it.
# We need to make sure we can import `server.py`

# Add the src directory to path so we can import the server module
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../src")))

# Install dependencies if not present? Assumed installed.

try:
    from exstruct_server.server import read_excel
except ImportError:
    print("Could not import read_excel from exstruct_server.server. Make sure you are in the correct directory and dependencies are installed.")
    sys.exit(1)

def test_read_excel():
    sample_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "../samples/sample.xlsx"))
    if not os.path.exists(sample_file):
        print(f"Sample file {sample_file} does not exist. Run create_sample.py first.")
        # Try to run create_sample.py automatically
        import create_sample
        
    print(f"Testing read_excel with {sample_file}...")
    try:
        result = read_excel(sample_file, mode="light")
        print("Result (first 500 chars):")
        print(result[:500])
        
        if "Sheet1" in result and "Header 1" in result:
             print("\nSUCCESS: Found expected content.")
        else:
             print("\nWARNING: content might be missing.")

    except Exception as e:
        print(f"\nFAILED: {e}")

if __name__ == "__main__":
    test_read_excel()
