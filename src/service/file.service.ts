import { Injectable } from '@nestjs/common';
import * as AdmZip from 'adm-zip';
import { Readable } from 'stream';

@Injectable()
export class FileService {
  async unzip(zipStream: Readable): Promise<string[]> {
    console.log('📂 Unzipping file...');

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      zipStream.on('data', (chunk) => {
        console.log(`📥 Received chunk of size: ${chunk.length}`);
        chunks.push(chunk);
      });

      zipStream.on('end', () => {
        console.log('✅ ZIP stream ended. Processing buffer...');
        try {
          const buffer = Buffer.concat(chunks);
          console.log(`🔍 Buffer size: ${buffer.length} bytes`);

          if (buffer.length === 0) {
            throw new Error('ZIP file is empty.');
          }

          const zip = new AdmZip(buffer);
          const entries = zip.getEntries();

          if (!entries || entries.length === 0) {
            throw new Error('No entries found in ZIP file.');
          }

          console.log(`📂 Extracted ${entries.length} files:`);
          const extractedFiles = entries.map((entry) => {
            console.log(`  - ${entry.entryName}`);
            return entry.entryName;
          });

          resolve(extractedFiles);
        } catch (error) {
          console.error('❌ Error processing ZIP:', error);
          reject(`Error processing ZIP: ${error.message || error}`);
        }
      });

      zipStream.on('error', (err) => {
        console.error('❌ Stream error:', err);
        reject(`Error processing ZIP stream: ${err.message}`);
      });
    });
  }
}
