import fs from "fs";
import path from "path";
import yaml from "yaml";
import Ajv from "ajv";
import { LogicalDataModelIntermediateRepresentationSchema } from "../types/logical_model";

export function loadLogicalModel(
  filePath: string,
): LogicalDataModelIntermediateRepresentationSchema {
  const fileContent = fs.readFileSync(filePath, "utf8");
  const parsed = yaml.parse(fileContent);

  const ajv = new Ajv();

  // Load schema
  // Assuming the schema is located at schema/logical_model_schema.json relative to project root
  // We need to resolve it relative to this file
  const schemaPath = path.resolve(
    __dirname,
    "../../schema/logical_model_schema.json",
  );
  const schemaContent = fs.readFileSync(schemaPath, "utf8");
  const schema = JSON.parse(schemaContent);

  const validate = ajv.compile(schema);
  const valid = validate(parsed);

  if (!valid) {
    throw new Error(`Validation failed: ${ajv.errorsText(validate.errors)}`);
  }

  return parsed as LogicalDataModelIntermediateRepresentationSchema;
}
