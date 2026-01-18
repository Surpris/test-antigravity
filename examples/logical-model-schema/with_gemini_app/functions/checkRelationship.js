module.exports = (targetEntityName, _options, { document }) => {
  // YAML全体を取得
  const data = document.data;
  
  if (!data || !data.entities) {
    return; // 構造自体がおかしい場合はSchemaバリデーションに任せる
  }

  // 定義されている全エンティティ名のリスト
  const definedEntities = Object.keys(data.entities);

  // ターゲットが存在するかチェック
  if (!definedEntities.includes(targetEntityName)) {
    return [
      {
        message: `Target entity "${targetEntityName}" is not defined in this model.`,
      },
    ];
  }
};