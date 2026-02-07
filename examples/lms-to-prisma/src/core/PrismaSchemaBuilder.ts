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
          const sourceField = `${relName} ${rel.target}[]`;
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
          enumLines.push(`  ${option}`);
        });
        enumLines.push('}');
        enums.push(enumLines.join('\n'));
      }
    }
    return enums;
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
