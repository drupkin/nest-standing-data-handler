import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { S3Service } from './s3/s3.service';
import { AppController } from './app.controller';
import { DownloadService } from './service/download.service';
import { FileService } from './service/file.service';
import { CsvProcessorService } from './service/csv.processor.service';
import { CsvService } from './service/csv.service';
import { DatabaseService } from './service/database.service';
import dataSource from './config/data-source.config';
import { ConfigModule } from '@nestjs/config';
import s3Config from './config/s3.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [s3Config],
      isGlobal: true, // Optional: makes ConfigService available globally
    }),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({}),
      dataSourceFactory: async () => {
        await dataSource.initialize();
        return dataSource;
      },
    }),
  ],
  controllers: [AppController],
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
