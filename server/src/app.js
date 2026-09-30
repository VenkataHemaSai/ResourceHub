import express from 'express';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/index.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
