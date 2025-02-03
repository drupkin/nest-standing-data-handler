import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { Readable } from 'stream';

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);

  async downloadFile(url: string): Promise<Readable> {
    this.logger.debug(`Downloading file from: ${url}`);

    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
    });

    return response.data;
  }
}
