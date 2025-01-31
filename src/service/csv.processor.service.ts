import { Injectable } from '@nestjs/common';
import { DownloadService } from './download.service';
import { FileService } from './file.service';
import { CsvService } from './csv.service';
import { DatabaseService } from './database.service';

@Injectable()
export class CsvProcessorService {
  constructor(
    private readonly downloadService: DownloadService,
    private readonly fileService: FileService,
    private readonly csvService: CsvService,
    private readonly databaseService: DatabaseService,
  ) {}

  async processZipFiles(
    p02List: Array<{ distributionDeliveryURI: string }>,
  ): Promise<void> {
    for (const p02 of p02List) {
      try {
        const zipStream = await this.downloadService.downloadFile(
          p02.distributionDeliveryURI,
        );

        const csvFiles = await this.fileService.unzip(zipStream);
        console.log('Extracted CSV files:', csvFiles);

        for (const csvFile of csvFiles) {
          try {
            await this.processCsvFile(csvFile.path);
          } catch (error) {
            console.error(
              `Error processing CSV file ${csvFile.name}:`,
              error.message,
            );
          }
        }
      } catch (error) {
        console.error(
          `Error processing ZIP from ${p02.distributionDeliveryURI}:`,
          error.message,
        );
      }
    }
  }

  private async processCsvFile(filePath: string): Promise<void> {
    try {
      console.log(`📂 Processing CSV file: ${filePath}`);

      const tableName = await this.csvService.getTableName(filePath);
      console.log(`📋 Table name: ${tableName}`);

      const columns = await this.csvService.getCsvColumns(filePath);
      console.log(`📋 Columns: ${columns.join(', ')}`);

      await this.databaseService.createTable(tableName, columns);
      console.log(`✅ Table ${tableName} created`);

      const data = await this.csvService.readCsvData(filePath);
      console.log(`📄 Read ${data.length} rows from CSV file`);

      await this.databaseService.insertData(tableName, data);
      console.log(`✅ Data inserted into table ${tableName}`);

      console.log(
        `🎉 CSV file ${filePath} processed and stored in table ${tableName}`,
      );
    } catch (error) {
      console.error(`❌ Error processing CSV file ${filePath}:`, error.message);
      throw error; // Re-throw the error to propagate it to the caller
    }
  }
}
