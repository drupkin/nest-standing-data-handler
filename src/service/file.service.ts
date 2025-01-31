import { Injectable } from '@nestjs/common';
import * as AdmZip from 'adm-zip';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class FileService {
  async unzip(
    zipStream: Readable,
  ): Promise<Array<{ path: string; name: string }>> {
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

          // Create a temporary directory to extract files
          const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unzip-'));
          console.log(`📂 Extracting files to temporary directory: ${tempDir}`);

          const extractedFiles = entries
            .map((entry) => {
              const entryName = entry.entryName;
              console.log(`  - ${entryName}`);

              if (entry.isDirectory) {
                console.log(`    Skipping directory: ${entryName}`);
                return null;
              }

              const outputPath = path.join(tempDir, entryName);
              fs.mkdirSync(path.dirname(outputPath), { recursive: true });
              fs.writeFileSync(outputPath, entry.getData());

              const fileName =
                entryName
                  .split('/')
                  .pop()
                  ?.replace(/\.[^/.]+$/, '') || 'unknown';

              return {
                path: outputPath, // Absolute path to the extracted file
                name: fileName, // File name without path and extension
              };
            })
            .filter((file) => file !== null);

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
