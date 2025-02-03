import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async createTableIfNotExists(
    tableName: string,
    columns: string[],
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const tableExists = await queryRunner.hasTable(tableName);

      if (!tableExists) {
        const columnDefinitions = columns
          .map((col) => `"${col}" TEXT`)
          .join(',\n');

        await queryRunner.query(`
          CREATE TABLE "${tableName}" (
            id SERIAL PRIMARY KEY,
            ${columnDefinitions}
          )
        `);

        this.logger.log(`✅ Created table: ${tableName}`);
      } else {
        this.logger.log(`ℹ️ Table ${tableName} already exists`);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `❌ Failed to create table ${tableName}: ${error.message}`,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async upsertData(tableName: string, data: any[]): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Batch insert in chunks of 1000
      const batchSize = 1000;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const columns = Object.keys(batch[0]);

        const values = batch
          .map(
            (item, index) =>
              `(${columns.map((_, colIndex) => `$${index * columns.length + colIndex + 1}`).join(',')})`,
          )
          .join(',');

        const query = `
          INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(',')})
          VALUES ${values}
          ON CONFLICT (id) DO UPDATE
          SET ${columns.map((c) => `"${c}" = EXCLUDED."${c}"`).join(',')}
        `;

        await queryRunner.query(
          query,
          batch.flatMap((item) => columns.map((col) => item[col])),
        );
      }

      await queryRunner.commitTransaction();
      this.logger.log(
        `✅ Inserted/updated ${data.length} rows into ${tableName}`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `❌ Failed to upsert data into ${tableName}: ${error.message}`,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
