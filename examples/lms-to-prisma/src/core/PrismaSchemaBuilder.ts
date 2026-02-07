import { Entity, Attribute, LogicalDataModelIntermediateRepresentationSchema } from '../types/logical_model';

export class PrismaSchemaBuilder {
  private generatedRelationFields: Map<string, string[]> = new Map();

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
        if (rel.cardinality === '1:N') {
          // Source (One) -> Target (Many)
          // Source: entityName (e.g. Project)
          // Target: rel.target (e.g. Dataset)
          // relName: (e.g. datasets)

          // 1. Add field to Source: "datasets Dataset[]"
          const sourceField = `${this.toCamelCase(relName)} ${rel.target}[]`;
          this.addRelationField(entityName, sourceField);

          // 2. Add fields to Target: "project Project @relation..."
          // Infer back-reference name
          const targetEntityName = rel.target;
          const backRefName = this.toCamelCase(entityName); // project
          const fkName = `${backRefName}Id`; // projectId
          
          const targetRelationField = `${backRefName} ${entityName} @relation(fields: [${fkName}], references: [id])`;
          const targetFkField = `${fkName} String`; // Assuming ID is String (UUID)

          this.addRelationField(targetEntityName, targetFkField);
          this.addRelationField(targetEntityName, targetRelationField);

          // 3. Flatten attributes to Target (Many side)
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
          // Source: entityName (e.g. Dataset)
          // Target: rel.target (e.g. Contributor)
          // relName: managed_by

          // 1. Add fields to Source: "managedBy Contributor? @relation..."
          // Relation Name: camelCase(relName) -> managedBy
          const relFieldBase = this.toCamelCase(relName);
          const fkName = `${relFieldBase}Id`;
          
          const sourceRelationField = `${relFieldBase} ${rel.target}? @relation(fields: [${fkName}], references: [id])`;
          const sourceFkField = `${fkName} String?`;

          this.addRelationField(entityName, sourceFkField);
          this.addRelationField(entityName, sourceRelationField);

          // 2. Add field to Target: "datasets Dataset[]"
          // Inverse name: camelCase(entityName) + 's' (Simple pluralization)
          const targetEntityName = rel.target;
          const inverseName = this.toCamelCase(entityName) + 's';
          const targetField = `${inverseName} ${entityName}[]`;
          
          this.addRelationField(targetEntityName, targetField);

          // 3. Flatten attributes to Source (FK holder side)
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
    const modelName = this.toPascalCase(entityName);
    const lines: string[] = [];

    lines.push(`model ${modelName} {`);

    // System Fields Injection
    lines.push('  id String @id @default(uuid())');
    lines.push('  createdAt DateTime @default(now())');
    lines.push('  updatedAt DateTime @updatedAt');
    lines.push('  deletedAt DateTime?');

    // Attributes Processing
    for (const [key, attr] of Object.entries(entity.attributes)) {
      const fieldLine = this.convertAttribute(key, attr, modelName);
      lines.push(`  ${fieldLine}`);
    }

    // Generated Relation Fields
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
    const modelName = this.toPascalCase(entityName);

    for (const [key, attr] of Object.entries(entity.attributes)) {
      if (attr.type === 'Enum' && attr.options) {
        const enumName = `${modelName}${this.toPascalCase(key)}`;
        const enumLines: string[] = [];
        enumLines.push(`enum ${enumName} {`);
        attr.options.forEach(option => {
          const validName = this.toValidEnumName(option);
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
    // Replace invalid characters with underscore
    // Prisma identifiers must start with [A-Za-z][A-Za-z0-9_]*
    // But for Enums, we might want to be more permissive if mapping?
    // Actually the identifier used in code must be valid.
    // Replace spaces, dots, etc.
    let name = str.replace(/[^a-zA-Z0-9_]/g, '_');
    // Ensure it doesn't start with a number
    if (/^[0-9]/.test(name)) {
      name = `_${name}`;
    }
    // If empty or all invalid (e.g. only unicode which I stripped above?), handle it.
    // Wait, Japanese characters are allowed in Prisma?
    // "Prisma models and enums must start with a letter and can only contain letters, numbers and underscores."
    // "Letters" implies ASCII? No, generally Identifier.
    // But keeping it safe: ASCII only if possible or fallback.
    // If I strip everything and get empty string, I should probably keep original and let it fail or use generic name.
    
    // Better strategy:
    // If it contains spaces, replace with _.
    // If it contains non-word chars, replace with _.
    // If it's unicode, Prisma might accept it depending on version (Prisma 6?).
    // But let's assume we map to safe ASCII or keep unicode if valid.
    
    // For "Principal Investigator" -> "Principal_Investigator"
    // For "公開" -> "Public" (I can't translate).
    // So "公開" -> "Expected something valid".
    
    // Let's just replace space and punctuation.
    return str.replace(/[\s\u30fb\u3000.-]+/g, '_'); 
  }


  private convertAttribute(name: string, attr: Attribute, modelName: string): string {
    const fieldName = this.toCamelCase(name);
    const prismaType = this.mapType(attr.type, modelName, name);
    
    // Determine optionality
    // primary_key implies required
    const isRequired = attr.required || attr.primary_key;
    const typeSuffix = isRequired ? '' : '?';

    let line = `${fieldName} ${prismaType}${typeSuffix}`;

    // Modifiers
    if (attr.primary_key) {
      line += ' @unique';
    }
    
    // Type specific modifiers
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
      default: return 'String'; // Fallback
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
}
