export interface YamlSchema {
  schema_version: string;
  model_name: string;
  entities: { [key: string]: EntityDef };
}

export interface EntityDef {
  description?: string;
  attributes: { [key: string]: AttributeDef };
  relationships?: { [key: string]: RelationshipDef };
}

export interface AttributeDef {
  type: string;
  description?: string;
  required?: boolean;
  primary_key?: boolean;
  note?: string;
  options?: string[]; // For Enum
}

export interface RelationshipDef {
  target: string;
  description?: string;
  cardinality: string;
  attributes?: { [key: string]: AttributeDef };
}
