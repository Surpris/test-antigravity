import * as fs from 'fs';
import * as path from 'path';
import Ajv from 'ajv';
import { LogicalModel } from './types';

/**
 * 論理データモデルのバリデーションを行うクラス。
 * JSON Schema による構造チェックと、エンティティ間の参照整合性チェックを提供します。
 */
export class Validator {
  private ajv: Ajv;
  private validateSchema: any;
  private schemaPath: string;

  /**
   * Validator インスタンスを初期化し、JSON Schema をロードします。
   */
  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    // スキーマファイルはプロジェクトルートの schema/logical_model_schema.json にあると想定
    this.schemaPath = path.resolve(process.cwd(), 'schema/logical_model_schema.json');
    this.loadSchema();
  }

  /**
   * 指定されたパスから JSON Schema を読み込み、コンパイルします。
   * @private
   */
  private loadSchema() {
    if (!fs.existsSync(this.schemaPath)) {
      throw new Error(`Schema file not found at: ${this.schemaPath}`);
    }
    const schemaJson = JSON.parse(fs.readFileSync(this.schemaPath, 'utf8'));
    this.validateSchema = this.ajv.compile(schemaJson);
  }

  /**
   * 与えられたデータのバリデーションを実行します。
   * @param data バリデーション対象のデータ
   * @returns バリデーション結果（有効かどうかとエラーメッセージの配列）
   */
  public validate(data: any): { valid: boolean; errors: string[] } {
    const valid = this.validateSchema(data);
    const errors: string[] = [];

    if (!valid && this.validateSchema.errors) {
      this.validateSchema.errors.forEach((err: any) => {
        errors.push(`Schema Error: Path ${err.instancePath} - ${err.message}`);
      });
    }

    // 論理バリデーション（参照整合性）
    if (data.entities) {
        const integrityErrors = this.checkReferentialIntegrity(data as LogicalModel);
        errors.push(...integrityErrors);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * エンティティ間の参照整合性（リレーションのターゲットが存在するか）をチェックします。
   * @param data 論理データモデル
   * @private
   * @returns 整合性エラーの配列
   */
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

