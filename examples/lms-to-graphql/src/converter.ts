import { LogicalModel, Entity, Attribute, Relationship } from './types';

export function convertLogicalModelToGraphQL(model: LogicalModel): string {
  const parts: string[] = [];

  // Add header
  parts.push(`# GraphQL Schema for ${model.model_name}`);
  if (model.description) {
    parts.push(`"""\n${model.description}\n"""`);
  }

  // Iterate over entities
  for (const [entityName, entity] of Object.entries(model.entities)) {
    parts.push(convertEntity(entityName, entity));
    
    // Check for relationships with attributes and generate intermediate types
    if (entity.relationships) {
      for (const [relName, rel] of Object.entries(entity.relationships)) {
        if (rel.attributes) {
          parts.push(convertRelationshipType(entityName, relName, rel));
        }
      }
    }
  }

  return parts.join('\n\n');
}

function convertEntity(name: string, entity: Entity): string {
  const lines: string[] = [];
  if (entity.description) {
    lines.push(`"""\n${entity.description}\n"""`);
  }
  lines.push(`type ${name} {`);

  // Attributes
  for (const [attrName, attr] of Object.entries(entity.attributes)) {
    lines.push(`  ${convertfield(attrName, attr)}`);
  }

  // Relationships
  if (entity.relationships) {
    for (const [relName, rel] of Object.entries(entity.relationships)) {
      lines.push(`  ${convertRelationshipField(name, relName, rel)}`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}

function convertfield(name: string, attr: Attribute, isEdgeProperty: boolean = false): string {
  let type = mapType(attr.type);
  
  // Handle ID for primary keys
  if (attr.primary_key) {
    type = 'ID';
  }

  // Handle required
  // For edge properties, we assume they are nullable unless explicitly required, 
  // but logically if they are attributes of the relation they might be required.
  // The schema says default required is false.
  if (attr.required || attr.primary_key) {
    type += '!';
  }

  const desc = attr.description ? `  "${attr.description}"\n  ` : '';
  return `${desc}${name}: ${type}`;
}

function mapType(type: Attribute['type']): string {
  switch (type) {
    case 'String': return 'String';
    case 'Integer': return 'Int';
    case 'Float': return 'Float';
    case 'Boolean': return 'Boolean';
    case 'Date': return 'String'; // Or Custom Scalar
    case 'DateTime': return 'String'; // Or Custom Scalar
    case 'Text': return 'String';
    case 'Enum': return 'String'; // Simplified for now, could generate Enum types
    default: return 'String';
  }
}

function convertRelationshipField(entityName: string, relName: string, rel: Relationship): string {
  let type = rel.target;

  // If attributes exist, point to the Intermediate Type
  if (rel.attributes) {
    type = getIntermediateTypeName(entityName, relName);
  }

  // Handle Cardinality
  const isList = rel.cardinality === '1:N' || rel.cardinality === '0:N' || rel.cardinality === 'N:M';
  if (isList) {
    type = `[${type}]`;
  }

  // Cardinality 1:1 or 1:N implies required? 
  // 1:1 -> Required? 0:1 -> Optional.
  // 1:N -> List required? Empty list?
  // Let's assume nullable for now unless we strictly enforce 1 vs 0.
  // Actually, '1:...' usually means mandatory relationship.
  const isRequired = rel.cardinality.startsWith('1');
  if (isRequired) {
    type += '!';
  }

  const desc = rel.description ? `  "${rel.description}"\n  ` : '';
  return `${desc}${relName}: ${type}`;
}

function convertRelationshipType(entityName: string, relName: string, rel: Relationship): string {
    const typeName = getIntermediateTypeName(entityName, relName);
    const lines: string[] = [];
    
    lines.push(`"""\nRelationship object for ${entityName}.${relName}\n"""`);
    lines.push(`type ${typeName} {`);
    
    // Target field
    // Usually we might call this 'node' or 'target' or the entity name (uncapitalized)
    // Let's use 'target' for consistency with our schema, or better yet, the type name in camelCase?
    // Schema uses 'target: "Contributor"'. Let's use 'node' as it is common in Relay, or just 'target'.
    lines.push(`  target: ${rel.target}!`);
    
    // Edge properties
    if (rel.attributes) {
      for (const [attrName, attr] of Object.entries(rel.attributes)) {
        lines.push(`  ${convertfield(attrName, attr, true)}`);
      }
    }
    
    lines.push('}');
    return lines.join('\n');
}

function getIntermediateTypeName(entityName: string, relName: string): string {
  // e.g. DatasetManagedBy
  return `${entityName}${capitalize(relName)}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
