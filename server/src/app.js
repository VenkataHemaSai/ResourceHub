import express from 'express';
import cookieParser from 'cookie-parser';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/v1', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
