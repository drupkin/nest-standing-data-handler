import { Injectable, Logger } from '@nestjs/common';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

@Injectable()
export class CsvService {
  private readonly logger = new Logger(CsvService.name);

  async getTableNameFromData(csvString: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = Readable.from(csvString).pipe(csv({ headers: false }));

      stream
        .on('data', (row: Record<number, string>) => {
          const values = Object.values(row) as string[];
          const tableName = values[1]?.trim() || values[0]?.trim(); // Fallback to first column
          this.logger.log(`📊 Extracted table name: ${tableName}`);
          resolve(tableName);
          stream.destroy(); // Stop reading further
        })
        .on('error', (error) => {
          this.logger.error(`❌ Error extracting table name: ${error.message}`);
          reject(error);
        });
    });
  }

  async getCsvColumnsFromData(csvString: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      let rowCount = 0;
      const stream = Readable.from(csvString).pipe(csv({ headers: false }));

      stream
        .on('data', (row: Record<number, string>) => {
          rowCount++;
          if (rowCount === 2) {
            const values = Object.values(row) as string[];
            resolve(this.handleDuplicateColumns(values));
            stream.destroy(); // Stop reading further
          }
        })
        .on('error', (error) => {
          this.logger.error(
            `❌ Error extracting column names: ${error.message}`,
          );
          reject(error);
        });
    });
  }

  async parseCsvData(csvString: string): Promise<Record<string, string>[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const columns = await this.getCsvColumnsFromData(csvString);
        this.logger.log(`📋 Extracted columns: ${columns.join(', ')}`);

        let rowCount = 0;
        const data: Record<string, string>[] = [];
        const stream = Readable.from(csvString).pipe(csv({ headers: false }));

        stream
          .on('data', (row: Record<number, string>) => {
            rowCount++;
            if (rowCount >= 3) {
              const values = Object.values(row) as string[];
              if (values.length !== columns.length) {
                this.logger.warn(
                  `⚠️ Column count mismatch in row ${rowCount}: Expected ${columns.length}, got ${values.length}`,
                );
                return; // Skip this row
              }

              const rowData: Record<string, string> = {};
              for (let i = 0; i < columns.length; i++) {
                rowData[columns[i]] = values[i]?.trim() || '';
              }
              data.push(rowData);
            }
          })
          .on('error', (error) => {
            this.logger.error(`❌ Error parsing CSV data: ${error.message}`);
            reject(error);
          })
          .on('end', () => {
            this.logger.log(`✅ Successfully parsed ${data.length} rows`);
            resolve(data);
          });
      } catch (error) {
        this.logger.error(`❌ Failed to parse CSV: ${error.message}`);
        reject(error);
      }
    });
  }

  private handleDuplicateColumns(columns: string[]): string[] {
    const columnCount: Record<string, number> = {};
    return columns.map((col) => {
      let sanitizedCol = col.trim();
      sanitizedCol = this.sanitizeColumnName(sanitizedCol);

      if (columnCount[sanitizedCol]) {
        columnCount[sanitizedCol]++;
        return `${sanitizedCol}_${columnCount[sanitizedCol]}`; // Append a number for duplicates
      } else {
        columnCount[sanitizedCol] = 1;
        return sanitizedCol;
      }
    });
  }

  private sanitizeColumnName(name: string): string {
    return name
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
  }
}
