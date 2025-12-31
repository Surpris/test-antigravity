import copy
from google.adk.agents.llm_agent import Agent, LlmResponse
# Content, Part などのスキーマも llm_agent またはその周辺からインポートできるか、
# あるいは vertexai のものを使用する必要があるか、検証結果に基づき調整します。
# dir(lm) の結果には LlmResponse がありましたが Content は見当たらなかったので、
# vertexai のものか、あるいは LlmResponse の内部コンストラクトを確認します。
# ここでは一旦 vertexai のものに戻すか、LlmResponse の content フィールドの使い方を確認します。
from vertexai.generative_models import Content, Part

def get_print_agent(text, name='print_agent'):
    """
    特定のテキストを常に出力する補助エージェント（Print Agent）を返します。
    """
    def before_model_callback(agent, llm_request):
        # LlmResponse を直接返すか、Content を返す仕様か確認が必要
        # 前回の dir(lm) では LlmResponse があった
        return LlmResponse(
            content=Content(
                role='model',
                parts=[Part.from_text(text)],
            )
        )

    agent = Agent(
        name=name,
        model='gemini-2.5-flash', # callbackを使用するためモデルは呼び出されない
        description='特定のメッセージを表示する補助エージェント',
        instruction='',
        before_model_callback=before_model_callback,
    )
    return agent

# --- リサーチエージェントの定義 ---

research_instruction1 = '''
あなたの役割は、記事の執筆に必要な情報を収集して調査レポートにまとめる事です。
指定されたテーマの記事を執筆する際に参考となるトピックを5項目程度のリストにまとめます。
後段のエージェントがこのリストに基づいて、調査レポートを作成します。
* 出力形式
日本語で出力。
'''

research_agent1 = Agent(
    name='research_agent1',
    model='gemini-2.5-flash',
    description='記事の執筆に必要な情報を収集してレポートにまとめるエージェント（テーマ選定）',
    instruction=research_instruction1,
)

research_instruction2 = '''
あなたの役割は、記事の執筆に必要な情報を収集して調査レポートにまとめる事です。
前段のエージェントは、5項目程度の調査対象トピックを指定します。
* 出力形式
日本語で出力。
調査レポートは、トピックごとに客観的情報をまとめます。各トピックについて、5文以上の長さで記述すること。
'''

research_agent2 = Agent(
    name='research_agent2',
    model='gemini-2.5-flash',
    description='記事の執筆に必要な情報を収集してレポートにまとめるエージェント（レポート作成）',
    instruction=research_instruction2,
)

# 最新のADKではAgentクラス自体がsub_agentsを持ち、直列的な実行も可能です。
research_agent = Agent(
    name='research_agent',
    model='gemini-2.5-flash',
    sub_agents=[
        get_print_agent('\n---\n## リサーチエージェントが調査レポートを作成します。\n---\n', name='print_report_header'),
        get_print_agent('\n## 調査対象のトピックを選定します。\n', name='print_topic_selection'),
        copy.deepcopy(research_agent1),
        get_print_agent('\n## 選定したトピックに基づいて、調査レポートを作成します。\n', name='print_report_creation'),
        copy.deepcopy(research_agent2),
        get_print_agent('\n#### 調査レポートが準備できました。記事の作成に取り掛かってもよいでしょうか？\n', name='print_report_footer'),
    ],
    description='記事の執筆に必要な情報を収集してレポートにまとめるエージェント',
)

# --- ライター・レビューエージェントの定義 ---

writer_instruction = '''
あなたの役割は、特定のテーマに関する気軽な読み物記事を書くことです。
記事の「テーマ」と、その内容に関連する「調査レポート」が与えられるので、
調査レポートに記載の客観的事実に基づいて、信頼性のある読み物記事を書いてください。
レビュアーによる修正ポイントが指摘された際は、直前に書いた記事を指摘に従って書き直してください。

**出力条件**
- トピックに関してある程度の基礎知識がある読者を前提として、数分で気軽に読める内容にしてください。
- 比較的カジュアルで語りかける口調の文章にします。
- 思考過程は出力せずに、最終結果だけを出力します。
- 記事タイトルは付けないで、次の構成で出力します。各セクションタイトルは、内容に合わせてアレンジしてください。
  0. 導入：セクションタイトルを付けないで、この記事を読みたくなる導入を1〜2文にまとめます。
  1. 概要：トピックの全体像をまとめて簡単に説明します。
  2. 最新情報：特に注目したい新しい情報を取り上げます。
  3. 実践：トピックに関して、読者自身がやってみるとよさそうな事を1つ紹介します。
  4. まとめ
- 各セクションのタイトルはマークダウンヘッダ ## 付けます。必要に応じて箇条書きのマークダウンを使用します。
- それ以外のマークダウンによる装飾は行いません。
'''

writer_agent = Agent(
    name='writer_agent',
    model='gemini-2.5-flash',
    description='特定のテーマに関する読み物記事を書くエージェント',
    instruction=writer_instruction,
)

review_instruction = '''
あなたの役割は、読み物記事をレビューして、記事の条件にあった内容にするための改善コメントを与える事です。

* 記事の条件
- 記事は、はじめに40文字程度のタイトルがあること。
  今日から役立つ生活情報があって「すぐに読まなきゃ」と読者が感じるタイトルにすること。
  タイトルはマークダウンヘッダ # をつけること。
- タイトルの直後に「なぜいまこのテーマを取り上げるのか」をまとめた導入を加えて、読者にこの記事を読む動機づけを与えます。
- 各セクションのサブタイトルには、絵文字を用いて親しみやすさを出すこと。
- 読者が今日から実践できる具体例が3つ以上紹介されていること。

* 出力形式
- 日本語で出力。
- はじめに、記事の良い点を説明します。
- 次に、修正ポイントを箇条書きで出力します。
'''

review_agent = Agent(
    name='review_agent',
    model='gemini-2.5-flash',
    description='読み物記事をレビューするエージェント',
    instruction=review_instruction,
)

write_and_review_agent = Agent(
    name='write_and_review_agent',
    model='gemini-2.5-flash',
    sub_agents=[
        get_print_agent('\n---\n## ライターエージェントが記事を執筆します。\n---\n', name='print_writer_header'),
        copy.deepcopy(writer_agent),
        get_print_agent('\n---\n## レビューエージェントが記事をレビューします。\n---\n', name='print_reviewer_header'),
        copy.deepcopy(review_agent),
        get_print_agent('\n#### レビューに基づいて記事の修正を依頼しますか？\n', name='print_reviewer_footer'),
    ],
    description='記事を作成、レビューする。',
)
