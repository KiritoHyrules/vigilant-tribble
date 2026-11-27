import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecurityModule } from './common/security/security.module';
import { ENV_FILES } from './config/env.files';
import { EnvironmentVariables, validateEnv } from './config/env.validation';
import { databaseOptions } from './database/database.options';
import { HealthController } from './health/health.controller';
import { AuditModule } from './modules/audit/audit.module';
import { IdentityPersistenceModule } from './modules/auth/identity-persistence.module';
import { CasePersistenceModule } from './modules/cases/case-persistence.module';
import { CasesModule } from './modules/cases/cases.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ENV_FILES,
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        ...databaseOptions({
          NODE_ENV: config.get('NODE_ENV', { infer: true }),
          PORT: config.get('PORT', { infer: true }),
          POSTGRES_HOST: config.get('POSTGRES_HOST', { infer: true }),
          POSTGRES_PORT: config.get('POSTGRES_PORT', { infer: true }),
          POSTGRES_DB: config.get('POSTGRES_DB', { infer: true }),
          POSTGRES_USER: config.get('POSTGRES_USER', { infer: true }),
          POSTGRES_PASSWORD: config.get('POSTGRES_PASSWORD', { infer: true }),
          CORS_ORIGINS: config.get('CORS_ORIGINS', { infer: true }),
        }),
        autoLoadEntities: true,
      }),
    }),
    SecurityModule,
    IdentityPersistenceModule,
    CasePersistenceModule,
    AuditModule,
    CasesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
