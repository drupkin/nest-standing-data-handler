import { Controller, Get, HttpStatus, Injectable, Res } from '@nestjs/common';
import { Response } from 'express';
import { CsvProcessorService } from 'src/service/csv.processor.service';

@Controller('app')
@Injectable()
export class AppController {
  constructor(private readonly csvProcessorService: CsvProcessorService) {}

  @Get('read')
  async readJson(@Res() res: Response): Promise<any> {
    const bucketName = 'dev-ops-industry-data-replication';
    const objectKey = `${bucketName}/MHHS/IF-flows/IF-047/2024/08/27/if-047-example.json`;

    await this.csvProcessorService.handlePub047Processing(
      bucketName,
      objectKey,
    );
    res.status(HttpStatus.OK);
  }
}
