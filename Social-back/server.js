import './scripts/ensureEnv.js';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './src/docs/swagger.js';
import usersRouter from './src/routes/users.js';
import authRouter from './src/routes/Auth.js';
import postsRouter from './src/routes/Post.js';
import commentsRouter from './src/routes/Comment.js';
import notificationsRouter from './src/routes/Notifications.js';
import adminRouter from './src/routes/Admin.js';
import mediaRouter from './src/routes/Media.js';
import sessionsRouter from './src/routes/session.routes.js';
import followRouter from './src/routes/Follow.js';
import savedPostRouter from './src/routes/SavedPost.js';
import reportRouter from './src/routes/Report.js';
import otpRouter from './src/routes/OTP.js';
import connectDB, { isDbConnected } from './src/db.js';
import errorHandler from './src/middlewares/errorHandler.js';
import rateLimiter from './src/middlewares/rateLimiter.js';
import { optionalAuth } from './src/middlewares/auth.js';
import logger from './src/utils/logger.js';
import path from 'path';

const app = express();
const isTestEnv = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(cors({
	origin: process.env.ALLOWED_ORIGINS?.split(',') ?? [],
	credentials: true,
}));

app.use(
	'/api-docs',
	swaggerUi.serve,
	swaggerUi.setup(swaggerSpec),
);

// Rate limiting
app.use(rateLimiter);

// Optional auth: update lastActiveAt for requests with a valid token
app.use(optionalAuth);

// Route registration - caching is applied per-route (GET handlers)
app.use('/api/users', usersRouter);
app.use('/api/auth', authRouter);
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/media', mediaRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/follows', followRouter);
app.use('/api/saved-posts', savedPostRouter);
app.use('/api/reports', reportRouter);
app.use('/api/otp', otpRouter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
	maxAge: '7d',
	immutable: true,
	setHeaders: (res) => {
		res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
	},
}));

// Centralized error handler
app.use(errorHandler);

// Start server wrapper (avoids top-level await so older Node versions work)
async function startServer() {
	if (!isTestEnv) {
		await connectDB();
	}

	// Load config after ensureEnv has potentially created .env
	const { default: config } = await import('./src/config.js');
	const PORT = config.PORT || 5000;

	app.get('/health', (req, res) => {
		res.json({ status: 'ok', port: PORT, dbConnected: isDbConnected() });
	});

	if (!isTestEnv) {
		app.listen(PORT, () => {
			logger.info(`Server running on port ${PORT} — DB connected: ${isDbConnected()}`);
		});
	}
}

startServer().catch((err) => {
	logger.error('Startup failed:', err);
	process.exit(1);
});

export default app;

