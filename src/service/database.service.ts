import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async createTable(tableName: string, columns: string[]): Promise<void> {
    const columnDefinitions = [
      'id SERIAL PRIMARY KEY',
      ...columns.map((column) => `"${column}" TEXT`),
    ].join(',');

    const query = `CREATE TABLE "${tableName}" (${columnDefinitions});`;
    console.log(`🚀 Executing query: ${query}`);
    await this.dataSource.query(query);
    console.log(`✅ Table ${tableName} created successfully`);
  }

  async insertData(
    tableName: string,
    data: Record<string, string>[],
  ): Promise<void> {
    if (data.length === 0) {
      console.warn(`⚠️ No data to insert into table ${tableName}`);
      return;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Escape column names with double quotes
      const columns = Object.keys(data[0]).map((col) => `"${col}"`);
      const values = data
        .map(
          (row) =>
            `(${columns.map((col) => `'${row[col.replace(/"/g, '')]}'`).join(',')})`,
        )
        .join(',');

      const query = `INSERT INTO "${tableName}" (${columns.join(',')}) VALUES ${values};`;
      console.log(`🚀 Executing query: ${query}`);
      await queryRunner.query(query);

      await queryRunner.commitTransaction();
      console.log(`✅ Data inserted into table ${tableName}`);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(
        `❌ Error inserting data into table ${tableName}:`,
        error.message,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
