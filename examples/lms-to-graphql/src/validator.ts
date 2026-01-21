import * as fs from 'fs';
import * as path from 'path';
import Ajv from 'ajv';
import { LogicalModel } from './types';

export class Validator {
  private ajv: Ajv;
  private validateSchema: any;
  private schemaPath: string;

  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    // Assuming the schema is located at ../schema/logical_model_schema.json relative to project root
    // When running from dist/ (compiled), __dirname is dist/src or dist/.
    // Let's try to resolve relative to process.cwd() or find a robust way.
    // For this example, let's assume we run from project root.
    this.schemaPath = path.resolve(process.cwd(), 'schema/logical_model_schema.json');
    this.loadSchema();
  }

  private loadSchema() {
    if (!fs.existsSync(this.schemaPath)) {
        // Fallback: try relative to source if running with ts-node directly in src context?
        // But process.cwd() is usually the project root.
      throw new Error(`Schema file not found at: ${this.schemaPath}`);
    }
    const schemaJson = JSON.parse(fs.readFileSync(this.schemaPath, 'utf8'));
    this.validateSchema = this.ajv.compile(schemaJson);
  }

  public validate(data: any): { valid: boolean; errors: string[] } {
    const valid = this.validateSchema(data);
    const errors: string[] = [];

    if (!valid && this.validateSchema.errors) {
      this.validateSchema.errors.forEach((err: any) => {
        errors.push(`Schema Error: Path ${err.instancePath} - ${err.message}`);
      });
    }

    // Logic validation (Referential Integrity)
    if (data.entities) {
        const integrityErrors = this.checkReferentialIntegrity(data as LogicalModel);
        errors.push(...integrityErrors);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private checkReferentialIntegrity(data: LogicalModel): string[] {
    const errors: string[] = [];
    const entityNames = new Set(Object.keys(data.entities));

    for (const [entityName, entity] of Object.entries(data.entities)) {
      if (entity.relationships) {
        for (const [relName, rel] of Object.entries(entity.relationships)) {
            if (!entityNames.has(rel.target)) {
                errors.push(`Reference Error: Entity '${entityName}' relationship '${relName}' points to missing entity '${rel.target}'`);
            }
        }
      }
    }
    return errors;
  }
}
