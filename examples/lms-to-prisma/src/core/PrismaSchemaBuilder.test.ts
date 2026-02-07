import { describe, it, expect } from 'vitest';
import { PrismaSchemaBuilder } from './PrismaSchemaBuilder';
import { Entity, LogicalDataModelIntermediateRepresentationSchema } from '../types/logical_model';

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
    it('should generate Enum definitions', () => {
      const entityName = 'Dataset';
      const entity: Entity = {
        description: 'Dataset Entity',
        attributes: {
          access_policy: {
            type: 'Enum',
            description: 'Access Policy',
            options: ['Public', 'Private', 'Embargoed'],
          },
        },
      };

      const builder = new PrismaSchemaBuilder();
      const enums = builder.generateEnums(entityName, entity);
      
      expect(enums).toHaveLength(1);
      const enumDef = enums[0];
      expect(enumDef).toContain('enum DatasetAccessPolicy {');
      expect(enumDef).toContain('Public');
      expect(enumDef).toContain('Private');
      expect(enumDef).toContain('Embargoed');
      expect(enumDef).toContain('}');
    });
  });

  describe('build', () => {
    it('should resolve 1:N relationships', () => {
      const schema: LogicalDataModelIntermediateRepresentationSchema = {
        schema_version: "1.0",
        model_name: 'TestModel',
        entities: {
          Project: {
            description: 'Project',
            attributes: {
              name: { type: 'String', description: 'Name', required: true }
            },
            relationships: {
              datasets: {
                target: 'Dataset',
                cardinality: '1:N',
                description: 'Project Datasets'
              }
            }
          },
          Dataset: {
            description: 'Dataset',
            attributes: {
              title: { type: 'String', description: 'Title', required: true }
            }
          }
        }
      };

      const builder = new PrismaSchemaBuilder();
      const result = builder.build(schema);

      // Check Project
      expect(result).toContain('model Project {');
      expect(result).toContain('datasets Dataset[]');

      // Check Dataset
      expect(result).toContain('model Dataset {');
      // We expect the back-reference to be automatically generated.
      // The field name 'project' is derived from the source entity 'Project'.
      expect(result).toContain('project Project @relation(fields: [projectId], references: [id])');
      expect(result).toContain('projectId String');
    });
  });
});
