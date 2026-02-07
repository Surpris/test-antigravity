import { describe, it, expect } from 'vitest';
import { PrismaSchemaBuilder } from './PrismaSchemaBuilder';
import { Entity } from '../types/logical_model';

describe('PrismaSchemaBuilder', () => {
  describe('convertEntity', () => {
    it('should convert a simple entity with attributes and system fields', () => {
      const entityName = 'Project';
      const entity: Entity = {
        description: 'Project Entity',
        attributes: {
          project_number: {
            type: 'String',
            description: 'Project Number',
            primary_key: true,
          },
          name: {
            type: 'String',
            description: 'Project Name',
            required: true,
          },
          description: {
            type: 'Text',
            description: 'Description',
            required: false,
          },
        },
      };

      const builder = new PrismaSchemaBuilder();
      const result = builder.convertEntity(entityName, entity);

      // Check for PascalCase model name
      expect(result).toContain('model Project {');

      // Check for System Fields
      expect(result).toContain('id String @id @default(uuid())');
      expect(result).toContain('createdAt DateTime @default(now())');
      expect(result).toContain('updatedAt DateTime @updatedAt');
      expect(result).toContain('deletedAt DateTime?');

      // Check for Primary Key conversion to @unique and camelCase
      expect(result).toContain('projectNumber String @unique');

      // Check for other fields
      expect(result).toContain('name String');
      // Optional field
      expect(result).toContain('description String? @db.Text');

      // Check closing brace
      expect(result).toContain('}');
    });

    it('should handle Enum types with correct naming convention', () => {
      const entityName = 'Project';
      const entity: Entity = {
        description: 'Project with Enum',
        attributes: {
          role_in_project: {
            type: 'Enum',
            description: 'Role',
            options: ['A', 'B'],
          },
        },
      };

      const builder = new PrismaSchemaBuilder();
      const result = builder.convertEntity(entityName, entity);
      
      // Expected Enum Name: ProjectRoleInProject
      expect(result).toContain('roleInProject ProjectRoleInProject?');
    });
  });
});
