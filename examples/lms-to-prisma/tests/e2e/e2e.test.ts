import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../');
const SCHEMA_FILE = path.join(PROJECT_ROOT, 'prisma/schema.prisma');
const INPUT_FILE = path.join(PROJECT_ROOT, 'sample/logical_model.yaml');

describe('E2E: Prisma Schema Generation CLI', () => {
  beforeAll(() => {
    // Ensure prisma directory exists
    if (!fs.existsSync(path.dirname(SCHEMA_FILE))) {
      fs.mkdirSync(path.dirname(SCHEMA_FILE), { recursive: true });
    }
    // Clean up previous output
    if (fs.existsSync(SCHEMA_FILE)) {
      fs.unlinkSync(SCHEMA_FILE);
    }
  });

  it('should generate a valid prisma schema with UserDefinedRelationship model', () => {
    // 1. Run the CLI
    try {
      execSync(`npm run generate:schema -- --input "${INPUT_FILE}" --output "${SCHEMA_FILE}"`, { cwd: PROJECT_ROOT, stdio: 'inherit' });
    } catch (error) {
       // Allow failure if the command itself fails (e.g. file not found)
       // but meaningful error messages should be printed.
       // However, strictly speaking, this test should fail if the command fails.
       throw new Error(`CLI execution failed: ${error}`);
    }

    // 2. Verify file exists
    expect(fs.existsSync(SCHEMA_FILE)).toBe(true);

    // 3. Verify content
    const content = fs.readFileSync(SCHEMA_FILE, 'utf-8');
    
    // Check for Generated Model (e.g., Project from sample yaml)
    expect(content).toContain('model Project {');
    
    // Check for UserDefinedRelationship template append
    expect(content).toContain('model UserDefinedRelationship {');
    expect(content).toContain('@@index([sourceId])');

    // 4. Validate with Prisma
    try {
      execSync('npx prisma validate', { cwd: PROJECT_ROOT, stdio: 'inherit' });
    } catch (error) {
      throw new Error(`Prisma validation failed: ${error}`);
    }
  });
});
