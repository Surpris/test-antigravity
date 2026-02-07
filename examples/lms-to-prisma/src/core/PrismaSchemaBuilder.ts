
import { Entity, Attribute, LogicalDataModelIntermediateRepresentationSchema } from '../types/logical_model';

export class PrismaSchemaBuilder {
  private generatedRelationFields: Map<string, string[]> = new Map();

  // Prisma & TypeScript reserved words
  private readonly reservedWords = new Set([
    'model', 'enum', 'type', 'interface', 'class', 'var', 'let', 'const', 
    'if', 'else', 'function', 'return', 'import', 'export', 'from', 
    'true', 'false', 'null', 'undefined', 'async', 'await', 
    'datasource', 'generator', 'String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json'
  ]);

  build(schema: LogicalDataModelIntermediateRepresentationSchema): string {
    this.generatedRelationFields.clear();
    const entities = schema.entities || {};

    // 1. Resolve Relationships
    this.resolveRelationships(entities);

    const lines: string[] = [];

    // 2. Generate Enums
    for (const [name, entity] of Object.entries(entities)) {
      const enums = this.generateEnums(name, entity);
      if (enums.length > 0) {
        lines.push(...enums);
        lines.push(''); // spacing
      }
    }

    // 3. Generate Models
    for (const [name, entity] of Object.entries(entities)) {
      lines.push(this.convertEntity(name, entity));
      lines.push(''); // spacing
    }

    return lines.join('\n');
  }

  private resolveRelationships(entities: Record<string, Entity>) {
    for (const [entityName, entity] of Object.entries(entities)) {
      if (!entity.relationships) continue;

      for (const [relName, rel] of Object.entries(entity.relationships)) {
        // Explicit relation name to handle multiple relations between same models
        const relationName = this.toPascalCase(relName); 
        
        if (rel.cardinality === '1:N') {
          // Source (One) -> Target (Many)
          const sourceField = `${this.toSafeCamelCase(relName)} ${this.toSafePascalCase(rel.target)}[] @relation("${relationName}")`;
          this.addRelationField(entityName, sourceField);

          // Target (Many) -> Source (One)
          const targetEntityName = rel.target;
          
          // Back-reference naming: <relName><SourceEntity> to ensure uniqueness
          // e.g. createdTasksUser
          const backRefName = this.toSafeCamelCase(relName) + this.toSafePascalCase(entityName);
          const fkName = `${backRefName}Id`; 
          
          const targetRelationField = `${backRefName} ${this.toSafePascalCase(entityName)} @relation("${relationName}", fields: [${fkName}], references: [id])`;
          const targetFkField = `${fkName} String`;

          this.addRelationField(targetEntityName, targetFkField);
          this.addRelationField(targetEntityName, targetRelationField);

          if (rel.attributes) {
             const targetEntity = entities[targetEntityName];
             if (targetEntity) {
                for (const [attrName, attr] of Object.entries(rel.attributes)) {
                   targetEntity.attributes[attrName] = attr;
                }
             }
          }
        } else if (rel.cardinality === '0:1') {
          // Source (Zero/One) -> Target (One) (BelongsTo)
          
          const relFieldBase = this.toSafeCamelCase(relName);
          const fkName = `${relFieldBase}Id`;
          
          const sourceRelationField = `${relFieldBase} ${this.toSafePascalCase(rel.target)}? @relation("${relationName}", fields: [${fkName}], references: [id])`;
          const sourceFkField = `${fkName} String?`;

          this.addRelationField(entityName, sourceFkField);
          this.addRelationField(entityName, sourceRelationField);

          // Target -> Source (Many)
          const targetEntityName = rel.target;
          
          // Inverse naming: <relName><SourceEntity>s (plural)
          const inverseName = this.toSafeCamelCase(relName) + this.toSafePascalCase(entityName) + 's';
          const targetField = `${inverseName} ${this.toSafePascalCase(entityName)}[] @relation("${relationName}")`;
          
          this.addRelationField(targetEntityName, targetField);

          if (rel.attributes) {
            for (const [attrName, attr] of Object.entries(rel.attributes)) {
              entity.attributes[attrName] = attr;
            }
          }
        }
      }
    }
  }

  private addRelationField(entityName: string, fieldLine: string) {
    if (!this.generatedRelationFields.has(entityName)) {
      this.generatedRelationFields.set(entityName, []);
    }
    this.generatedRelationFields.get(entityName)?.push(fieldLine);
  }

  convertEntity(entityName: string, entity: Entity): string {
    const modelName = this.toSafePascalCase(entityName);
    const lines: string[] = [];

    lines.push(`model ${modelName} {`);

    lines.push('  id String @id @default(uuid())');
    lines.push('  createdAt DateTime @default(now())');
    lines.push('  updatedAt DateTime @updatedAt');
    lines.push('  deletedAt DateTime?');

    for (const [key, attr] of Object.entries(entity.attributes)) {
      const fieldLine = this.convertAttribute(key, attr, modelName);
      lines.push(`  ${fieldLine}`);
    }

    if (this.generatedRelationFields.has(entityName)) {
      const relFields = this.generatedRelationFields.get(entityName);
      relFields?.forEach(field => {
        lines.push(`  ${field}`);
      });
    }

    lines.push('}');
    return lines.join('\n');
  }

  generateEnums(entityName: string, entity: Entity): string[] {
    const enums: string[] = [];
    const modelName = this.toSafePascalCase(entityName);

    for (const [key, attr] of Object.entries(entity.attributes)) {
      if (attr.type === 'Enum' && attr.options) {
        const enumName = `${modelName}${this.toPascalCase(key)}`;
        const enumLines: string[] = [];
        enumLines.push(`enum ${enumName} {`);
        
        const usedNames = new Set<string>();

        attr.options.forEach((option, index) => {
          let validName = this.toValidEnumName(option);

          // Fallback if invalid (empty, just underscores, or doesn't start with letter)
          // Prisma Enum values must start with a letter [A-Za-z]
          if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(validName)) {
             validName = `Option_${index + 1}`;
          }

          // Ensure uniqueness
          if (usedNames.has(validName)) {
             validName = `${validName}_${index + 1}`;
          }
          usedNames.add(validName);

          if (validName !== option) {
            enumLines.push(`  ${validName} @map("${option}")`);
          } else {
            enumLines.push(`  ${option}`);
          }
        });
        enumLines.push('}');
        enums.push(enumLines.join('\n'));
      }
    }
    return enums;
  }

  private toValidEnumName(str: string): string {
    // Replace spaces and specific separators with underscore
    let name = str.replace(/[\s\u30fb\u3000.-]+/g, '_'); 
    // Replace non-alphanumeric with nothing (or underscore? duplicate underscores are ugly)
    name = name.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // Collapse multiple underscores
    name = name.replace(/_+/g, '_');
    // Trim underscores
    name = name.replace(/^_+|_+$/g, '');

    return name;
  }

  private convertAttribute(name: string, attr: Attribute, modelName: string): string {
    const fieldName = this.toSafeCamelCase(name);
    const prismaType = this.mapType(attr.type, modelName, name);
    
    const isRequired = attr.required || attr.primary_key;
    const typeSuffix = isRequired ? '' : '?';

    let line = `${fieldName} ${prismaType}${typeSuffix}`;

    if (attr.primary_key) {
      line += ' @unique';
    }
    
    if (attr.type === 'Text') {
      line += ' @db.Text';
    }
    if (attr.type === 'Date') {
      line += ' @db.Date';
    }

    return line;
  }

  private mapType(yamlType: Attribute['type'], modelName: string, attrName: string): string {
    switch (yamlType) {
      case 'String': return 'String';
      case 'Integer': return 'Int';
      case 'Float': return 'Float';
      case 'Boolean': return 'Boolean';
      case 'Date': return 'DateTime';
      case 'DateTime': return 'DateTime';
      case 'Text': return 'String';
      case 'Enum': return `${modelName}${this.toPascalCase(attrName)}`;
      default: return 'String';
    }
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
      .replace(/^\w/, c => c.toUpperCase());
  }

  private toCamelCase(str: string): string {
    return str
      .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
      .replace(/^\w/, c => c.toLowerCase());
  }

  private toSafePascalCase(str: string): string {
    const pascal = this.toPascalCase(str);
    if (this.reservedWords.has(pascal) || this.reservedWords.has(pascal.toLowerCase())) {
      return `${pascal}_`;
    }
    return pascal;
  }

  private toSafeCamelCase(str: string): string {
    const camel = this.toCamelCase(str);
    if (this.reservedWords.has(camel) || this.reservedWords.has(camel.toLowerCase())) {
      return `${camel}_`;
    }
    return camel;
  }
}
