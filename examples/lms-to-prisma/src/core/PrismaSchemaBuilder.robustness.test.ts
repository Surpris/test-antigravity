
import { describe, it, expect } from 'vitest';
import { PrismaSchemaBuilder } from './PrismaSchemaBuilder';
import { Attribute, LogicalDataModelIntermediateRepresentationSchema } from '../types/logical_model';

describe('PrismaSchemaBuilder - Robustness & Edge Cases', () => {

  describe('1. Multiple Relations between same entities', () => {
    it('should distinctively name back-references when multiple relations exist', () => {
      const schema: LogicalDataModelIntermediateRepresentationSchema = {
        schema_version: "1.0",
        model_name: "MultiRel",
        entities: {
          User: {
            description: "User",
            attributes: {
              name: { type: "String", description: "Name" }
            },
            relationships: {
              created_tasks: {
                target: "Task",
                cardinality: "1:N",
                description: "Tasks created by user"
              },
              assigned_tasks: {
                target: "Task",
                cardinality: "1:N",
                description: "Tasks assigned to user"
              }
            }
          },
          Task: {
            description: "Task",
            attributes: {
              title: { type: "String", description: "Title" }
            }
          }
        }
      };

      const builder = new PrismaSchemaBuilder();
      const result = builder.build(schema);

      // Verify User model has named relations
      const userBlock = result.match(/model User \{([\s\S]*?)\}/)?.[1] || '';
      expect(userBlock).toMatch(/createdTasks Task\[\] @relation\("CreatedTasks"\)/);
      expect(userBlock).toMatch(/assignedTasks Task\[\] @relation\("AssignedTasks"\)/);

      // Verify Task model has distinct back-references
      const taskBlock = result.match(/model Task \{([\s\S]*?)\}/)?.[1] || '';
      
      // createdTasksUser User @relation("CreatedTasks", ...)
      expect(taskBlock).toMatch(/createdTasksUser User @relation\("CreatedTasks", fields: \[createdTasksUserId\], references: \[id\]\)/);
      expect(taskBlock).toMatch(/createdTasksUserId String/);
      
      // assignedTasksUser User @relation("AssignedTasks", ...)
      expect(taskBlock).toMatch(/assignedTasksUser User @relation\("AssignedTasks", fields: \[assignedTasksUserId\], references: \[id\]\)/);
      expect(taskBlock).toMatch(/assignedTasksUserId String/);
    });
  });

  describe('2. Self-Reference Relations', () => {
    it('should handle self-referencing relationship correctly', () => {
      const schema: LogicalDataModelIntermediateRepresentationSchema = {
        schema_version: "1.0",
        model_name: "SelfRef",
        entities: {
          Employee: {
            description: "Employee",
            attributes: {
              name: { type: "String", description: "Name" }
            },
            relationships: {
              manager: {
                target: "Employee",
                cardinality: "0:1", 
                description: "Manager"
              }
            }
          }
        }
      };

      const builder = new PrismaSchemaBuilder();
      const result = builder.build(schema);

      const block = result.match(/model Employee \{([\s\S]*?)\}/)?.[1] || '';
      
      // Source: manager Employee? @relation("Manager", fields: [managerId], references: [id])
      expect(block).toMatch(/manager Employee\? @relation\("Manager", fields: \[managerId\], references: \[id\]\)/);
      expect(block).toMatch(/managerId String\?/);

      // Inverse: managerEmployees Employee[] @relation("Manager")
      expect(block).toMatch(/managerEmployees Employee\[\] @relation\("Manager"\)/);
    });
  });

  describe('3. Reserved Words', () => {
    it('should rename entities or fields that conflict with Prisma reserved words', () => {
      const schema: LogicalDataModelIntermediateRepresentationSchema = {
        schema_version: "1.0",
        model_name: "Reserved",
        entities: {
          Model: { // 'model' is reserved keyword
            description: "Reserved Entity Name",
            attributes: {
              enum: { // 'enum' is reserved keyword
                 type: "String", description: "Reserved Field Name"
              }
            }
          }
        }
      };

      const builder = new PrismaSchemaBuilder();
      const result = builder.build(schema);

      // Expect 'Model' to be renamed to 'Model_'
      expect(result).not.toMatch(/^model Model \{/m); 
      expect(result).toMatch(/^model Model_ \{/m);

      const block = result.match(/model Model_ \{([\s\S]*?)\}/)?.[1] || '';
      // Expect 'enum' field to be renamed to 'enum_'
      expect(block).not.toMatch(/^\s+enum String/m);
      expect(block).toMatch(/^\s+enum_ String/m);
    });
  });

  describe('4. Data Type Validation', () => {
    const createAttr = (type: Attribute['type']): Attribute => ({ type, description: `Test ${type} attribute` });
  
    it('should map all supported types correctly', () => {
      const schema: LogicalDataModelIntermediateRepresentationSchema = {
        schema_version: "1.0",
        model_name: "Types",
        entities: {
          AllTypes: {
            description: "All Types",
            attributes: {
              f_string: createAttr("String"),
              f_int: createAttr("Integer"),
              f_float: createAttr("Float"),
              f_bool: createAttr("Boolean"),
              f_date: createAttr("Date"), 
              f_datetime: createAttr("DateTime"),
              f_text: createAttr("Text"), 
            }
          }
        }
      };

      const builder = new PrismaSchemaBuilder();
      const result = builder.build(schema);
      const block = result.match(/model AllTypes \{([\s\S]*?)\}/)?.[1] || '';

      expect(block).toMatch(/fString String/);
      expect(block).toMatch(/fInt Int/);
      expect(block).toMatch(/fFloat Float/);
      expect(block).toMatch(/fBool Boolean/);
      // Allow optional
      expect(block).toMatch(/fDate DateTime\?? @db.Date/);
      expect(block).toMatch(/fDatetime DateTime/);
      expect(block).toMatch(/fText String\?? @db.Text/);
    });
  });

});
