import { Injectable } from '@nestjs/common';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { Pub047 } from 'src/dto/pub047';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class S3Service {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      endpoint: 'http://localhost:4566',
      region: 'eu-west-1',
      credentials: {
        accessKeyId: 'dev-access-key',
        secretAccessKey: 'dev-secret-key',
      },
    });
  }

  async getObject(bucket: string, key: string): Promise<Array<Pub047>> {
    console.log('Fetching object from S3:', { bucket, key });

    try {
      const command = new GetObjectCommand({ Bucket: bucket, Key: key });
      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error(`Object ${key} in bucket ${bucket} has no content`);
      }
      const bodyString = await this.streamToString(response.Body as Readable);
      const pub047Array = plainToInstance(
        Array<Pub047>,
        JSON.parse(bodyString),
      );

      return pub047Array;
    } catch (error) {
      console.error('Error fetching object from S3:', error);
      throw error; // Re-throw the error for the controller to handle
    }
  }

  private async streamToString(stream: Readable): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      stream.on('error', reject);
    });
  }
}
