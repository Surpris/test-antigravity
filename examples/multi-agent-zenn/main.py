import copy
from google.adk.agents.llm_agent import Agent
from agents import research_agent, write_and_review_agent

# --- Root Agent (業務フローエージェント) の定義 ---

root_instruction = '''
何ができるか聞かれた場合は、以下の処理をすることをわかりやすくフレンドリーな文章にまとめて返答してください。
- ユーザーが指定したテーマの記事を作成する業務フローを実行する。
- はじめに、テーマに関する調査レポートを作成する。
- その後、ライターエージェントとレビューエージェントが協力して、編集方針に則した記事を作成する。

ユーザーが記事のテーマを指定した場合は、次のフローを実行します。
1. そのテーマの記事の作成に取り掛かる旨を伝えて、research_agent に転送して、調査レポートを依頼します。
2. ユーザーが記事の作成を指示したら、write_and_review_agent に転送して、記事の作成とレビューを依頼します。
3. ユーザーが記事の修正を希望する場合は、write_and_review_agent に転送します。

**条件**
research_agent のニックネームは、リサーチエージェント
write_and_review_agent のニックネームは、ライターエージェントとレビューエージェント
'''

root_agent = Agent(
    name='article_generation_flow',
    model='gemini-2.5-flash',
    instruction=root_instruction,
    sub_agents=[
        copy.deepcopy(research_agent),
        copy.deepcopy(write_and_review_agent),
    ],
    description='記事を作成する業務フローを実行するエージェント'
)

def run_chat():
    """
    ユーザーと Root Agent との対話形式のチャットループを実行します。
    """
    print("--- マルチエージェント記事作成システム ---")
    print("利用可能なコマンド: exit, quit")
    
    # セッション（会話履歴）の初期化
    history = []
    
    while True:
        try:
            user_input = input("\n会員様: ")
            if user_input.lower() in ["exit", "quit"]:
                break
            
            # Agent の実行
            response = root_agent(user_input, history=history)
            
            # 応答の表示
            # response が LlmResponse オブジェクトの場合、その属性を確認します。
            # 以前の Zenn 記事では response.content.parts でしたが、
            # 最新の adk では構造が変わっている可能性があるため、安全な取得を試みます。
            try:
                text = response.parts[0].text
            except (AttributeError, IndexError):
                try:
                    text = response.content.parts[0].text
                except:
                    text = str(response)
            
            print(f"\nエージェント: {text}")
            
            # historyの更新
            # historyに含めるContent/Partをインポートする必要があります
            from vertexai.generative_models import Content, Part
            history.append(Content(role="user", parts=[Part.from_text(user_input)]))
            history.append(Content(role="model", parts=[Part.from_text(text)]))
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"エラーが発生しました: {e}")

if __name__ == "__main__":
    run_chat()
