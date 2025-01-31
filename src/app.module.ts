import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { S3Service } from './s3/s3.service';
import { S3Controller } from './s3/s3.controller';
import { DownloadService } from './service/download.service';
import { FileService } from './service/file.service';
import { CsvProcessorService } from './service/csv.processor.service';
import { CsvService } from './service/csv.service';
import { DatabaseService } from './service/database.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '123',
      database: 'ops-inbound-db',
      synchronize: true,
    }),
  ],
  controllers: [S3Controller],
  providers: [
    S3Service,
    DownloadService,
    FileService,
    CsvProcessorService,
    CsvService,
    DatabaseService,
  ],
})
export class AppModule {}
