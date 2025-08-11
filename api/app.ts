/**
 * This is a API server
 */

import express, { type Request, type Response, type NextFunction }  from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import bindRoutes from './routes/bind.js';
import messageRoutes from './routes/message.js';
import qrRoutes from './routes/qr.js';

// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env
dotenv.config();

// 打印环境变量，用于调试
console.log('Environment variables:');
console.log('APP_URL:', process.env.APP_URL);
console.log('VERCEL_URL:', process.env.VERCEL_URL);

// 从命令行或环境中获取VERCEL_URL
const vercelUrl = process.env.VERCEL_URL || process.argv.find(arg => arg.startsWith('VERCEL_URL='))?.split('=')[1];
console.log('Detected VERCEL_URL:', vercelUrl);

// 创建一个中间件来处理请求头中的VERCEL_URL
const vercelUrlMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const vercelUrlFromHeader = req.headers['x-vercel-url'] || req.headers['vercel-url'];
  
  if (vercelUrlFromHeader && typeof vercelUrlFromHeader === 'string') {
    // 始终从请求头中更新APP_URL，无论之前是否已设置
    const newAppUrl = `https://${vercelUrlFromHeader}`;
    if (process.env.APP_URL !== newAppUrl) {
      process.env.APP_URL = newAppUrl;
      console.log('更新APP_URL从请求头:', process.env.APP_URL);
    }
  } else if (vercelUrl && !process.env.APP_URL) {
    // 如果在Vercel环境中，确保设置APP_URL
    process.env.APP_URL = `https://${vercelUrl}`;
    console.log('设置APP_URL从VERCEL_URL:', process.env.APP_URL);
  }
  
  next();
};

// 创建Express应用
const app = express();

// 配置CORS，允许所有来源
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Vercel-Url', 'Vercel-Url'],
  credentials: true,
  maxAge: 86400 // 24小时
}));

// 应用Vercel URL中间件
app.use(vercelUrlMiddleware);

// 解析JSON请求体
app.use(express.json());

// 解析URL编码的请求体
app.use(express.urlencoded({ extended: true }));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/bind', bindRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/qr', qrRoutes);

// 健康检查端点
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404处理
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

export default app;