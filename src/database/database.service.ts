import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createTableIfNotExists(
    tableName: string,
    columns: string[],
  ): Promise<void> {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      throw new Error('Invalid table name');
    }

    const result: Array<{ exists: boolean }> = await this.prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
          AND table_name = ${tableName}
      ) AS "exists"
    `;

    const tableExists = result[0]?.exists;
    if (!tableExists) {
      const columnDefinitions = columns
        .map((col) => `"${col}" TEXT`)
        .join(',\n');

      const createQuery = `
        CREATE TABLE "${tableName}" (
          id SERIAL PRIMARY KEY,
          ${columnDefinitions}
        )
      `;

      try {
        await this.prisma.$executeRawUnsafe(createQuery);
        this.logger.debug(`✅ Created table: ${tableName}`);
      } catch (error: any) {
        this.logger.error(
          `❌ Failed to create table ${tableName}: ${error.message}`,
        );
        throw error;
      }
    } else {
      this.logger.warn(`ℹ️ Table ${tableName} already exists`);
    }
  }

  async upsertData(tableName: string, data: any[]): Promise<void> {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
      throw new Error('Invalid table name');
    }

    if (!data.length) return;

    const batchSize = 1000;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const columns = Object.keys(batch[0]);

      const valuePlaceholders: string[] = [];
      const values: any[] = [];
      let placeholderIndex = 1;

      for (const item of batch) {
        const placeholders = columns.map(() => `$${placeholderIndex++}`);
        valuePlaceholders.push(`(${placeholders.join(',')})`);
        for (const col of columns) {
          values.push(item[col]);
        }
      }

      const insertColumns = columns.map((col) => `"${col}"`).join(',');
      const onConflictSet = columns
        .map((col) => `"${col}" = EXCLUDED."${col}"`)
        .join(',');

      const query = `
        INSERT INTO "${tableName}" (${insertColumns})
        VALUES ${valuePlaceholders.join(',')}
        ON CONFLICT (id) DO UPDATE
        SET ${onConflictSet}
      `;

      try {
        await this.prisma.$executeRawUnsafe(query, ...values);
      } catch (error: any) {
        this.logger.error(
          `❌ Failed to upsert data into ${tableName}: ${error.message}`,
        );
        throw error;
      }
    }
    this.logger.debug(
      `✅ Inserted/updated ${data.length} rows into ${tableName}`,
    );
  }
}
