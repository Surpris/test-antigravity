import { Entity, Attribute } from '../types/logical_model';

export class PrismaSchemaBuilder {
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

    lines.push('}');
    return lines.join('\n');
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
