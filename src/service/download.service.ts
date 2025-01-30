import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Readable } from 'stream';

@Injectable()
export class DownloadService {
  async downloadFile(url: string): Promise<Readable> {
    console.log(`Downloading file from: ${url}`);

    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
    });

    return response.data;
  }
}
