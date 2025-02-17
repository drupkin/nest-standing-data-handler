import { Injectable, Logger } from '@nestjs/common';
import { DownloadService } from './download.service';
import { FileService } from './file.service';
import { CsvService } from './csv.service';
import { DatabaseService } from '../database/database.service';
import { S3Service } from 'src/s3/s3.service';

@Injectable()
export class CsvProcessorService {
  private readonly logger = new Logger(CsvProcessorService.name);

  constructor(
    private readonly downloadService: DownloadService,
    private readonly fileService: FileService,
    private readonly csvService: CsvService,
    private readonly databaseService: DatabaseService,
    private readonly s3Service: S3Service,
  ) {}

  async handlePub047Processing(
    bucketName: string,
    objectKey: string,
  ): Promise<void> {
    const pub047Array = await this.s3Service.getObject(bucketName, objectKey);
    const allP02Lists = this.validatePub047(pub047Array);

    console.debug(
      `✅ Processing ${allP02Lists.length} P02 entries sequentially...`,
    );

    for (const p02 of allP02Lists) {
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

      this.logger.debug(
        `✅ Successfully processed ${fileName} into ${tableName}`,
      );
    } catch (error) {
      this.logger.error(`❌ Failed to process ${fileName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validates and extracts P02List from a given pub047 JSON array.
   * @param pub047Array The JSON array retrieved from S3
   * @returns Flattened array of P02List entries
   */
  private validatePub047(pub047Array: any[]): any[] {
    if (!Array.isArray(pub047Array) || pub047Array.length === 0) {
      throw new Error('S3 response is not a valid JSON array or is empty.');
    }

    const allP02Lists = pub047Array
      .map((item, index) => {
        if (!item.CustomBlock) {
          this.logger.error(
            `❌ CustomBlock is missing in item ${index}:`,
            item,
          );
          return [];
        }
        if (!item.CustomBlock.P02List) {
          this.logger.error(
            `❌ P02List is missing in item ${index}:`,
            item.CustomBlock,
          );
          return [];
        }
        return item.CustomBlock.P02List;
      })
      .flat();

    if (allP02Lists.length === 0) {
      throw new Error('No valid P02List found in the entire JSON array.');
    }
    return allP02Lists;
  }
}
