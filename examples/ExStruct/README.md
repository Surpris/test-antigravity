# ExStruct MCP Server

This directory contains an MCP server that uses the [ExStruct](https://github.com/harumiWeb/exstruct) library to extract structure from Excel files.

## Installation

```bash
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

## Configuration

To use this server with Claude for Desktop or other MCP clients, add the following to your MCP configuration file:

```json
{
  "mcpServers": {
    "mcp-exstruct-server": {
      "command": "uv",
      "args": [
        "--directory",
        "<ABSOLUTE_PATH_TO_THIS_DIRECTORY>",
        "run",
        "src/exstruct_server/server.py"
      ],
      "alwaysAllow": [
        "add"
      ],
      "disabled": false
    }
  }
}
```

Replace `<ABSOLUTE_PATH_TO_THIS_DIRECTORY>` with the full path to `examples/ExStruct`.

## Usage

The server exposes a generic `read_excel` tool.

**Tool:** `read_excel`

- **Arguments:**
  - `file_path`: Path to the `.xlsx` file.
  - `mode`: Extraction mode (`light`, `standard`, `verbose`).
