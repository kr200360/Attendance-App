import app from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { config } from './config/env';
import { logger } from './shared/logger';

async function bootstrap() {
  try {
    await connectDatabase();

    const server = app.listen(config.port, () => {
      logger.info(`EduTrack API Server listening on port ${config.port}`);
      logger.info(`REST API base URL: http://localhost:${config.port}${config.apiPrefix}`);
      logger.info(`Swagger Documentation available at: http://localhost:${config.port}${config.apiPrefix}/docs`);
    });

    // Graceful Shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach(signal => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, shutting down gracefully...`);
        server.close(async () => {
          await disconnectDatabase();
          logger.info('Process terminated.');
          process.exit(0);
        });
      });
    });
  } catch (error: any) {
    logger.error('Failed to start application:', error.message);
    process.exit(1);
  }
}

bootstrap();
