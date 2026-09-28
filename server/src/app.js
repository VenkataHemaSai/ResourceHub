import express from 'express';
import healthRouter from './routes/health.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json());

app.use('/api/v1', healthRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
