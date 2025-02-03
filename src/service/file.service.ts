import { Injectable, Logger } from '@nestjs/common';
import { Readable } from 'stream';
import * as AdmZip from 'adm-zip';
import * as path from 'path';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  async unzip(
    zipStream: Readable,
  ): Promise<Array<{ name: string; data: Buffer }>> {
    this.logger.log('📂 Unzipping file...');

    try {
      const buffer = await this.collectStream(zipStream);
      return this.extractFilesFromBuffer(buffer);
    } catch (error) {
      this.logger.error(`❌ Error processing ZIP: ${error.message}`);
      throw error;
    }
  }

  private async collectStream(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  private extractFilesFromBuffer(
    buffer: Buffer,
  ): Array<{ name: string; data: Buffer }> {
    const zip = new AdmZip(buffer);
    return zip
      .getEntries()
      .filter((entry) => !entry.isDirectory)
      .map((entry) => ({
        name: this.getCleanFileName(entry.entryName),
        data: entry.getData(),
      }));
  }

  private getCleanFileName(entryName: string): string {
    const baseName = path.basename(entryName);
    return baseName.replace(/\.[^/.]+$/, ''); // Remove extension
  }
}
