import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { S3Service } from './s3/s3.service';
import { S3Controller } from './s3/s3.controller';
import { DownloadService } from './service/download.service';
import { FileService } from './service/file.service';
import { CsvProcessorService } from './service/csv.processor.service';
import { CsvService } from './service/csv.service';
import { DatabaseService } from './service/database.service';
import dataSource from './config/data-source.config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({}),
      dataSourceFactory: async () => {
        await dataSource.initialize();
        return dataSource;
      },
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
