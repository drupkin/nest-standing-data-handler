import { Injectable, Logger } from '@nestjs/common';
import { DownloadService } from './download.service';
import { FileService } from './file.service';
import { CsvService } from './csv.service';
import { DatabaseService } from './database.service';

@Injectable()
export class CsvProcessorService {
  private readonly logger = new Logger(CsvProcessorService.name);

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

        for (const csvFile of csvFiles) {
          await this.processCsvData(csvFile.name, csvFile.data);
        }
      } catch (error) {
        this.logger.error(
          `Error processing ${p02.distributionDeliveryURI}: ${error.message}`,
        );
      }
    }
  }

  private async processCsvData(fileName: string, data: Buffer): Promise<void> {
    const csvString = data.toString('utf-8');

    try {
      const tableName = await this.csvService.getTableNameFromData(csvString);
      const columns = await this.csvService.getCsvColumnsFromData(csvString);
      const rows = await this.csvService.parseCsvData(csvString);

      await this.databaseService.createTableIfNotExists(tableName, columns);
      await this.databaseService.upsertData(tableName, rows);

      this.logger.log(
        `✅ Successfully processed ${fileName} into ${tableName}`,
      );
    } catch (error) {
      this.logger.error(`❌ Failed to process ${fileName}: ${error.message}`);
      throw error;
    }
  }
}
