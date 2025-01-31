import { Controller, Get, HttpStatus, Injectable, Res } from '@nestjs/common';
import { Response } from 'express';
import { S3Service } from './s3.service';
import { CsvProcessorService } from 'src/service/csv.processor.service';

@Controller('s3')
@Injectable()
export class S3Controller {
  constructor(
    private readonly s3Service: S3Service,
    private readonly csvProcessorService: CsvProcessorService,
  ) {}

  @Get('read')
  async readJson(@Res() res: Response): Promise<any> {
    const bucketName = 'dev-ops-industry-data-replication';
    const objectKey = `${bucketName}/MHHS/IF-flows/IF-047/2024/08/27/if-047-example.json`;

    const pub047Array = await this.s3Service.getObject(bucketName, objectKey);

    const allP02Lists = this.validatePub047(pub047Array);

    console.log('✅ Processing all P02 entries:', allP02Lists);

    await this.csvProcessorService.processZipFiles(allP02Lists);
    res.status(HttpStatus.OK);
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
}
