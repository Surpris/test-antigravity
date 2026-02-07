import yaml
import json
from typing import Dict, List, Any, Optional

# ==========================================
# 1. 変換エンジンクラス (汎用ロジック)
# ==========================================
class DataTransformationEngine:
    def __init__(self, mapping_def: Dict):
        self.mapping_def = mapping_def
        self.entity_mappings = {
            m['source_selector']['context']: m 
            for m in mapping_def['entity_mappings']
        }
        self.results = [] # 変換後の全エンティティをフラットに保持するリスト

    def set_nested_value(self, target_dict: Dict, path: str, value: Any):
        """ドット区切りのパス (a.b.c) に値をセットする"""
        keys = path.split('.')
        current = target_dict
        for key in keys[:-1]:
            if key not in current:
                current[key] = {}
            current = current[key]
        current[keys[-1]] = value

    def apply_attribute_mapping(self, source_data: Dict, target_data: Dict, mapping_rules: List[Dict]):
        """属性のマッピング適用"""
        for attr_map in mapping_rules:
            src_key = attr_map['source_attribute']
            rule_type = attr_map.get('rule', 'direct_copy')
            
            # ソースデータの取得
            if src_key not in source_data:
                continue
            value = source_data[src_key]

            # ルール適用
            if rule_type == 'ignore':
                continue
            elif rule_type == 'static_value':
                value = attr_map['static_value']
            elif rule_type == 'map_values':
                value_map = attr_map.get('value_map', {})
                value = value_map.get(value, value) # マッチしなければ元の値

            # ターゲットへのセット (path対応)
            if 'target_path' in attr_map:
                self.set_nested_value(target_data, attr_map['target_path'], value)
            elif 'target_attribute' in attr_map:
                target_data[attr_map['target_attribute']] = value

    def process_entity(self, source_data: Dict, context_uri: str, parent_ref: Optional[Dict] = None, parent_rel_map: Optional[Dict] = None):
        """エンティティを再帰的に変換する"""
        
        # 1. 対応するマッピング定義を探す
        mapping_rule = self.entity_mappings.get(context_uri)
        if not mapping_rule:
            print(f"Warning: No mapping rule found for context {context_uri}")
            return

        # 2. ターゲットデータの器を作成
        target_entity = {}
        # 便宜上、何のエンティティか分かるようにcontextを持たせておく（出力用）
        target_entity['_context'] = mapping_rule['target_selector']['context']

        # 3. 属性マッピングの実行
        self.apply_attribute_mapping(source_data, target_entity, mapping_rule.get('attribute_mappings', []))

        # 4. 親からの逆参照リンク解決 (Inverse Relationship)
        # 例: Project(親) -> has_datasets -> Dataset(子) の処理中に、
        # Dataset側に belongs_to_project = Project(親) をセットする
        if parent_ref and parent_rel_map:
            if parent_rel_map.get('direction') == 'inverse':
                target_rel_name = parent_rel_map['target_relationship']
                # 循環参照を防ぐため、ここでは簡易的にIDや参照オブジェクトをセットする
                # 本来はID参照が望ましいが、論理モデル上はオブジェクト埋め込みとして表現
                target_entity[target_rel_name] = parent_ref

        # 5. リレーションシップの再帰処理
        for rel_map in mapping_rule.get('relationship_mappings', []):
            src_rel = rel_map['source_relationship']
            
            # ソースデータにリレーションが存在するか
            if src_rel in source_data:
                children = source_data[src_rel]
                if not isinstance(children, list):
                    children = [children] # 1:1でもリストとして扱う

                # 子要素のContextを特定する必要がある
                # ※簡易実装: マッピング定義のリレーション情報から推測するか、データ自体に型情報が必要。
                # ここでは「DMPモデル定義」を知っている前提でハードコードせず、
                # 汎用的にするために「マッピング定義の description」等から推論すべきだが、
                # 今回はデモ用としてリレーション名から決め打ちでContextを渡す。
                child_context = ""
                if src_rel == "has_datasets":
                    child_context = "http://schema.org/Dataset"
                elif src_rel == "has_contributors":
                    child_context = "http://schema.org/Person"
                elif src_rel == "collected_by":
                    child_context = "http://schema.org/Person"
                
                if child_context:
                    for child in children:
                        self.process_entity(child, child_context, parent_ref=target_entity, parent_rel_map=rel_map)

        # 6. 結果リストに追加
        self.results.append(target_entity)
        return target_entity

# ==========================================
# 2. 実行用サンプルデータ (Mock)
# ==========================================
# logical_model.yaml (DMP) に準拠した入力データ
mock_dmp_data = {
    "project_number": "KAKENHI-12345678",
    "attributes": { # ※本来のJSON構造はフラットかattribute下か実装依存だが、ここではフラットと仮定してマージ
    },
    # Project attributes
    "project_number": "JP20H00000", 
    
    # Relationships
    "has_datasets": [
        {
            "dataset_no": 1,
            "title": "意識調査アンケート生データ 2024",
            "access_policy": "非共有・非公開", # これが変換されるはず
            "collected_by": {
                "contributor_id": "P001",
                "name": "山田 太郎",
                "role_in_project": "Principal Investigator"
            }
        },
        {
            "dataset_no": 2,
            "title": "集計用Pythonスクリプト",
            "access_policy": "公開",
            "collected_by": {
                "contributor_id": "P002",
                "name": "鈴木 花子",
                "role_in_project": "Data Manager"
            }
        }
    ]
}

# ==========================================
# 3. メイン実行ブロック
# ==========================================
def main():
    # 実際のファイル読み込み（環境に合わせてパスを変更してください）
    # with open('dmp_to_cao_mapping.yaml', 'r', encoding='utf-8') as f:
    #     mapping_def = yaml.safe_load(f)
    
    # ここでは添付された mapping content を直接使用します
    mapping_yaml_content = """
mapping_id: "DMP_to_CAO_Mapping_v0.1"
source_model: "ResearchDataManagementPlan_LogicalModel"
target_model: "ResearchDataManagement_LogicalModel"
entity_mappings:
  - source_selector:
      context: "http://schema.org/ResearchProject"
    target_selector:
      context: "http://schema.org/ResearchProject"
    attribute_mappings:
      - source_attribute: "project_number"
        rule: "ignore" 
        target_attribute: "project_name"
    relationship_mappings:
      - source_relationship: "has_datasets"
        target_relationship: "belongs_to_project"
        direction: "inverse"

  - source_selector:
      context: "http://schema.org/Dataset"
    target_selector:
      context: "http://schema.org/Dataset"
    attribute_mappings:
      - source_attribute: "title"
        target_attribute: "data_name"
      - source_attribute: "dataset_no"
        target_attribute: "data_no"
      - source_attribute: "access_policy"
        target_attribute: "access_type"
        target_path: "has_access_right.access_type"
        rule: "map_values"
        value_map:
          "公開": "公開"
          "共有": "共有"
          "非共有・非公開": "非公開"
    relationship_mappings:
      - source_relationship: "collected_by"
        target_relationship: "created_datasets"
        direction: "inverse"

  - source_selector:
      context: "http://schema.org/Person"
    target_selector:
      context: "http://schema.org/Person"
    attribute_mappings:
      - source_attribute: "name"
        target_attribute: "name"
      - source_attribute: "contributor_id"
        target_attribute: "person_id"
"""
    mapping_def = yaml.safe_load(mapping_yaml_content)

    # エンジン初期化
    engine = DataTransformationEngine(mapping_def)

    print("--- 変換開始 ---")
    # Project (Root) から変換開始
    engine.process_entity(mock_dmp_data, "http://schema.org/ResearchProject")

    print(f"--- 変換完了: {len(engine.results)} 個のエンティティを生成 ---")
    
    # 結果の表示 (JSON)
    # 循環参照を含むため、表示用に少し加工（親参照を文字列化）
    def clean_for_print(obj):
        new_obj = {}
        for k, v in obj.items():
            if isinstance(v, dict) and '_context' in v:
                new_obj[k] = f"[Ref to {v['_context']}]" # 簡易表示
            else:
                new_obj[k] = v
        return new_obj

    for i, entity in enumerate(engine.results):
        print(f"\n[Entity {i+1}]: {entity.get('_context')}")
        print(json.dumps(clean_for_print(entity), indent=2, ensure_ascii=False))

if __name__ == "__main__":
    main()
