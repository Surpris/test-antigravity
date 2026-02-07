
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
        model_name: "TestModel",
        entities: {
          Project: {
            description: "Project",
            attributes: {
              name: { type: "String", description: "Name", required: true },
            },
            relationships: {
              datasets: {
                target: "Dataset",
                cardinality: "1:N",
                description: "Project Datasets",
              },
            },
          },
          Dataset: {
            description: "Dataset",
            attributes: {
              title: { type: "String", description: "Title", required: true },
            },
          },
        },
      };

      const builder = new PrismaSchemaBuilder();
      const result = builder.build(schema);

      // Check Project
      expect(result).toContain("model Project {");
      expect(result).toContain('datasets Dataset[] @relation("Datasets")');

      // Check Dataset
      expect(result).toContain("model Dataset {");
      
      // We expect the back-reference to be generated with robust naming.
      // <relName><Source> -> "datasetsProject"
      expect(result).toContain(
        'datasetsProject Project @relation("Datasets", fields: [datasetsProjectId], references: [id])'
      );
      expect(result).toContain("datasetsProjectId String");
    });

    it('should flatten attributes from 0:1 relationships (BelongsTo) into the source model', () => {
      const schema: LogicalDataModelIntermediateRepresentationSchema = {
        schema_version: "1.0",
        model_name: 'TestModel',
        entities: {
          Dataset: {
            description: 'Dataset',
            attributes: {
              title: { type: 'String', description: 'Title' }
            },
            relationships: {
              managed_by: {
                target: 'Contributor',
                cardinality: '0:1',
                description: 'Managed By',
                attributes: {
                  managed_from: {
                    type: 'Date',
                    description: 'Managed Since'
                  }
                }
              }
            }
          },
          Contributor: {
            description: 'Contributor',
            attributes: {
              name: { type: 'String', description: 'Name' }
            }
          }
        }
      };

      const builder = new PrismaSchemaBuilder();
      const result = builder.build(schema);

      // Dataset should have the FK and the flattened attribute
      expect(result).toContain('model Dataset {');
      // Rel name "ManagedBy" from "managed_by"
      expect(result).toContain('managedBy Contributor? @relation("ManagedBy", fields: [managedById], references: [id])');
      expect(result).toContain('managedById String?');
      expect(result).toContain('managedFrom DateTime? @db.Date');
      
      // Contributor should have the inverse relation
      // Inverse logic: <relName><Source>s -> managedByDatasets
      expect(result).toContain('model Contributor {');
      expect(result).toContain('managedByDatasets Dataset[] @relation("ManagedBy")');
    });

    it('should flatten attributes from 1:N relationships into the target model (Many side)', () => {
      const schema: LogicalDataModelIntermediateRepresentationSchema = {
        schema_version: "1.0",
        model_name: 'TestModel',
        entities: {
          Project: {
            description: 'Project',
            attributes: {
              name: { type: 'String', description: 'Name' }
            },
            relationships: {
              datasets: {
                target: 'Dataset',
                cardinality: '1:N',
                description: 'Project Datasets',
                attributes: {
                  added_at: {
                     type: 'DateTime',
                     description: 'Date added to project'
                  }
                }
              }
            }
          },
          Dataset: {
            description: 'Dataset',
            attributes: {
              title: { type: 'String', description: 'Title' }
            }
          }
        }
      };
      
      const builder = new PrismaSchemaBuilder();
      const result = builder.build(schema);

      // Dataset is the Target (Many side), so it gets the FK and the attribute
      expect(result).toContain('model Dataset {');
      // "Datasets" relation name
      // BackRef: datasetsProject
      expect(result).toContain('datasetsProject Project @relation("Datasets", fields: [datasetsProjectId], references: [id])');
      expect(result).toContain('datasetsProjectId String');
      expect(result).toContain('addedAt DateTime');
    });
  });
});
