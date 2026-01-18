import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import Ajv from 'ajv';
import { YamlSchema } from './types';

// Default schema location relative to built file (dist/validator.js -> ../schema/logical_model_schema.json)
const DEFAULT_SCHEMA_PATH = path.resolve(__dirname, '../schema/logical_model_schema.json');

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class ModelValidator {
  private validateAjv: any;

  constructor(schemaPath?: string) {
    const sPath = schemaPath || DEFAULT_SCHEMA_PATH;
    
    // Allow override or fallback logic if needed, but for now rely on path resolve
    if (!fs.existsSync(sPath)) {
      throw new Error(`Schema file not found at ${sPath}. Please ensure the package is correctly installed.`);
    }

    const schemaJson = JSON.parse(fs.readFileSync(sPath, 'utf8'));
    const ajv = new Ajv({ allErrors: true });
    this.validateAjv = ajv.compile(schemaJson);
  }

  public validate(yamlContent: string): ValidationResult {
    const errors: string[] = [];
    let data: YamlSchema;

    try {
      data = yaml.load(yamlContent) as YamlSchema;
    } catch (e: any) {
      return { valid: false, errors: [`YAML Parse Error: ${e.message}`] };
    }

    // A. AJV Validation (Schema)
    const validSchema = this.validateAjv(data);
    if (!validSchema && this.validateAjv.errors) {
       this.validateAjv.errors.forEach((err: any) => {
         errors.push(`[Schema] Path: ${err.instancePath} | Message: ${err.message}`);
       });
    }

    // B. Referential Integrity Validation (Logic)
    const integrityErrors = this.checkReferentialIntegrity(data);
    errors.push(...integrityErrors);

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private checkReferentialIntegrity(data: YamlSchema): string[] {
    const errors: string[] = [];
    const entityNames = new Set(Object.keys(data.entities || {}));

    for (const [entityName, entityDef] of Object.entries(data.entities || {})) {
      if (!entityDef.relationships) continue;

      for (const [relName, relDef] of Object.entries(entityDef.relationships)) {
        const target = relDef.target;
        
        if (!entityNames.has(target)) {
          errors.push(`[Integrity] Broken Link in [${entityName}]: relationship '${relName}' targets missing entity '${target}'`);
        }
      }
    }
    return errors;
  }
}
