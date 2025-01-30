import { Controller, Get, Injectable } from '@nestjs/common';
import { S3Service } from './s3.service';
import { DownloadService } from 'src/service/download.service';
import { FileService } from 'src/service/file.service';

@Controller('s3')
@Injectable()
export class S3Controller {
  constructor(
    private readonly s3Service: S3Service,
    private readonly downloadService: DownloadService,
    private readonly fileService: FileService,
  ) {}

  @Get('read')
  async readJson(): Promise<any> {
    const bucketName = 'dev-ops-industry-data-replication';
    const objectKey = `${bucketName}/MHHS/IF-flows/IF-047/2024/08/27/if-047-example.json`;

    const pub047Array = await this.s3Service.getObject(bucketName, objectKey);

    // Validate and extract P02List entries
    const allP02Lists = this.validatePub047(pub047Array);

    console.log('✅ Processing all P02 entries:', allP02Lists);

    await this.processZipFiles(allP02Lists);
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
          console.error(`❌ CustomBlock is missing in item ${index}:`, item);
          return [];
        }
        if (!item.CustomBlock.P02List) {
          console.error(
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

  private async processZipFiles(p02List: any[]): Promise<void> {
    for (const p02 of p02List) {
      try {
        const zipStream = await this.downloadService.downloadFile(
          p02.distributionDeliveryURI,
        );

        const csvFiles = await this.fileService.unzip(zipStream);

        console.log('Extracted CSV files:', csvFiles);
      } catch (error) {
        console.error(`Error processing ZIP:`, error.message);
      }
    }
  }
}
