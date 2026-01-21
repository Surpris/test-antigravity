export interface LogicalModel {
  schema_version: string;
  model_name: string;
  description?: string;
  entities: { [key: string]: Entity };
}

export interface Entity {
  description: string;
  attributes: { [key: string]: Attribute };
  relationships?: { [key: string]: Relationship };
}

export interface Attribute {
  type: 'String' | 'Integer' | 'Float' | 'Boolean' | 'Date' | 'DateTime' | 'Text' | 'Enum';
  description: string;
  required?: boolean;
  primary_key?: boolean;
  note?: string;
  options?: string[];
}

export interface Relationship {
  target: string;
  description?: string;
  cardinality: '1:1' | '1:N' | '0:1' | '0:N' | 'N:M';
  attributes?: { [key: string]: Attribute };
}
