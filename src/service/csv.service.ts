import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

@Injectable()
export class CsvService {
  private currentStream: Readable | null = null;

  async getTableName(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = fs
        .createReadStream(filePath)
        .pipe(csv({ headers: false }));
      this.currentStream = stream;

      stream
        .on('data', (row: Record<number, string>) => {
          const values = Object.values(row) as string[];
          const tableName = values[1]; // Second element is the table name
          resolve(tableName);
          this.destroyStream();
        })
        .on('error', (error) => reject(error));
    });
  }

  async getCsvColumns(filePath: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      let rowCount = 0;
      const columns: string[] = [];
      const stream = fs
        .createReadStream(filePath)
        .pipe(csv({ headers: false }));
      this.currentStream = stream;

      stream
        .on('data', (row: Record<number, string>) => {
          rowCount++;
          if (rowCount === 2) {
            const values = Object.values(row) as string[];
            columns.push(...values);
            resolve(columns);
            this.destroyStream();
          }
        })
        .on('error', (error) => reject(error));
    });
  }

  async readCsvData(filePath: string): Promise<Record<string, string>[]> {
    return new Promise(async (resolve, reject) => {
      try {
        const columns = await this.getCsvColumns(filePath);
        console.log(`📋 Columns: ${columns.join(', ')}`);

        let rowCount = 0;
        const data: Record<string, string>[] = [];
        const stream = fs
          .createReadStream(filePath)
          .pipe(csv({ headers: false }));
        this.currentStream = stream;

        stream
          .on('data', (row: Record<number, string>) => {
            rowCount++;
            if (rowCount >= 3) {
              const values = Object.values(row) as string[];
              const rowData: Record<string, string> = {};
              for (let i = 0; i < columns.length; i++) {
                rowData[columns[i]] = values[i];
              }
              data.push(rowData);
            }
          })
          .on('error', (error) => reject(error))
          .on('end', () => {
            this.destroyStream();
            resolve(data);
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  destroyStream(): void {
    if (this.currentStream) {
      this.currentStream.destroy();
      this.currentStream = null;
      console.log('🚮 Stream destroyed');
    }
  }
}
