# .agent/tools/user_db_tool.py
# Remarks: `antigravity.tools` module is not found in PyPI. This code is just a pseudo code.
from antigravity.tools import Tool, tool

class UserDBTool(Tool):
    """社内DBからユーザー情報を検索するツール"""
    
    @tool
    def search_user(self, email: str) -> dict:
        """
        メールアドレスでユーザーを検索します。
        
        Args:
            email (str): 検索対象のメールアドレス
        """
        # 実際のDB接続ロジック（例: SQL実行など）
        # ...
        return {"id": 123, "name": "山田 太郎", "status": "active"}
