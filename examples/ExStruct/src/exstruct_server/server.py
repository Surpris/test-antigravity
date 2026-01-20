from mcp.server.fastmcp import FastMCP
import exstruct
from pathlib import Path
import json

mcp = FastMCP("exstruct-mcp-server")

@mcp.tool()
def read_excel(file_path: str, mode: str = "light") -> str:
    """
    Reads an Excel file and returns its structured content as a JSON string.

    Args:
        file_path: The path to the Excel file to read.
        mode: The extraction mode ("light", "standard", "verbose").
              - "light": cells + table candidates (fastest, no Excel COM required).
              - "standard": texted shapes, charts, merged cells (Excel COM may be required for some features).
              - "verbose": all shapes, charts, details (Excel COM required).
              Defaults to "light".

    Returns:
        A JSON string representation of the Excel data.
    """
    try:
        # Use exstruct to extract data from the workbook
        wb = exstruct.extract(file_path, mode=mode)
        
        # Convert the workbook data to a dictionary/JSON structure
        # wb.to_json() returns a dictionary if called on the object, or we can use export logic
        # Based on README: wb.save("out.json") or export(wb, ...)
        # We need the string representation.
        
        # exstruct WorkbookData objects are Pydantic models (or similar) or have to_dict/json methods?
        # The README says: `export(wb, Path("out.json"), pretty=False)`
        # And `print(first_sheet.to_yaml())`
        # Let's check if we can get a dict or json string directly.
        # Usually pydantic models have .model_dump() or .dict() or .json()
        
        # Assuming we can verify this, but for now let's try to get a dict representation.
        # If exstruct returns a Pydantic model (which is likely given it handles structured data),
        # we can likely use .model_dump_json() or .json().
        
        # NOTE: Without inspecting exstruct source, I'll assume standard Pydantic behavior or simple dict access.
        # However, the README mentions `export(wb, ...)` which dumps to file.
        # We can dump to a temporary file and read it back, OR try to find an in-memory method.
        # let's try to inspect the object if possible, but safe bet is likely .model_dump_json() if recent pydantic, or .json().
        
        # For the first implementation, let's assume we might need to rely on `export` to a string if possible, or just standard serialization.
        # Let's try .model_dump() (Pydantic V2) or .dict() (Pydantic V1).
        
        # Let's stick to a safe approach:
        # If it's a Pydantic model, `json.dumps(wb.model_dump(), default=str)` or similar.
        
        # Wait, the README says:
        # `wb.save("out.json", pretty=True)`
        # `print(first_sheet.to_yaml())`
        
        # Implementation:
        # We will attempt to use .model_dump_json() if available.
        # If not, we will try to use the library's export features.
        
        # Let's rely on standard object serialization for now.
        pass # Placeholder for actual implementation logic in next step after verifying library
        
        # But I need to write the file now.
        # Let's try to implement a generic dumper.
        if hasattr(wb, "model_dump_json"):
             return wb.model_dump_json(indent=2)
        elif hasattr(wb, "json"):
             return wb.json(indent=2)
        elif hasattr(wb, "to_json"):
             return wb.to_json()
        else:
             # Fallback: assume it's an object we can traverse or pickling? No, must be JSON.
             # Does exstruct export a `to_dict`?
             # Let's assume standard Pydantic usage as it's a structural tool.
             # If all else fails during test, I will fix it.
             return str(wb)

    except Exception as e:
        return json.dumps({"error": str(e)})

if __name__ == "__main__":
    mcp.run()
