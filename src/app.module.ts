import { Module } from '@nestjs/common';
import { S3Service } from './s3/s3.service';
import { AppController } from './app.controller';
import { DownloadService } from './service/download.service';
import { FileService } from './service/file.service';
import { CsvProcessorService } from './service/csv.processor.service';
import { CsvService } from './service/csv.service';
import { DatabaseService } from './database/database.service';
import { ConfigModule } from '@nestjs/config';
import s3Config from './config/s3.config';
import { PrismaService } from './database/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [s3Config],
      isGlobal: true, // Optional: makes ConfigService available globally
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
    PrismaService,
  ],
})
export class AppModule {}
