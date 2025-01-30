import { Module } from '@nestjs/common';
import { S3Service } from './s3/s3.service';
import { S3Controller } from './s3/s3.controller';
import { DownloadService } from './service/download.service';
import { FileService } from './service/file.service';

@Module({
  imports: [],
  controllers: [S3Controller],
  providers: [S3Service, DownloadService, FileService],
})
export class AppModule {}
