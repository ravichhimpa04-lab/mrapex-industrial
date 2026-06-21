import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes/index.js';
import { errorMiddleware } from './middleware/error.js';
import { globalRateLimit } from './middleware/global-rate-limit.js';
import logger from './utils/logger.js';
import { BodyLimit } from './constants/common.js';

const app = express();

app.set('trust proxy', true);

process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
});

process.on('SIGINT', async () => {
    logger.info('Interrupted');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    logger.info('SIGTERM signal received');

    await new Promise((resolve) => setTimeout(resolve, 3000));

    logger.info('Exiting');
    process.exit();
});

app.use(helmet());

// Live frontend ke liye secure aur dynamic CORS configuration
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'https://mrapexindustrial.in',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Blocked by MR Apex CORS Policy'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('combined'));
app.use(globalRateLimit);

app.use(express.json({
    limit: BodyLimit,
}));

app.use(express.urlencoded({
    extended: true,
    limit: BodyLimit,
}));

app.use('/', routes());

app.use(errorMiddleware);

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
    logger.info(`🚀 API Server running on port ${port}`);
});

export default app;