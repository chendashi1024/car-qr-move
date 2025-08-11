import express, { Request, Response } from 'express';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// 获取基础URL的辅助函数
const getBaseUrl = (req: Request): string => {
  // 1. 优先使用APP_URL环境变量
  if (process.env.APP_URL) {
    console.log('使用APP_URL环境变量:', process.env.APP_URL);
    return process.env.APP_URL;
  }
  
  // 2. 从请求头中获取Vercel URL
  const vercelUrlFromHeader = req.headers['x-vercel-url'] || req.headers['vercel-url'];
  if (vercelUrlFromHeader && typeof vercelUrlFromHeader === 'string') {
    const url = `https://${vercelUrlFromHeader}`;
    console.log('使用请求头中的Vercel URL:', url);
    return url;
  }
  
  // 3. 从环境变量中获取Vercel URL
  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL}`;
    console.log('使用环境变量中的Vercel URL:', url);
    return url;
  }
  
  // 4. 从命令行参数中获取Vercel URL
  const vercelUrlFromArgs = process.argv.find(arg => arg.startsWith('VERCEL_URL='))?.split('=')[1];
  if (vercelUrlFromArgs) {
    const url = `https://${vercelUrlFromArgs}`;
    console.log('使用命令行参数中的Vercel URL:', url);
    return url;
  }
  
  // 5. 最后使用本地开发URL
  console.log('使用本地开发URL: http://localhost:5173');
  return 'http://localhost:5173';
};

// 生成二维码接口
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { uuid, format = 'png', size = 256 } = req.body;

    // 如果没有提供UUID，生成一个新的
    const qrUuid = uuid || uuidv4();
    
    // 构建二维码URL
    const baseUrl = getBaseUrl(req);
    const qrUrl = `${baseUrl}/${qrUuid}`;
    
    console.log('生成二维码URL:', qrUrl);

    // 生成二维码配置
    const qrOptions = {
      width: Math.min(Math.max(size, 128), 1024), // 限制尺寸在128-1024之间
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M' as const
    };

    let qrData: string;

    if (format === 'svg') {
      // 生成SVG格式
      qrData = await QRCode.toString(qrUrl, {
        ...qrOptions,
        type: 'svg'
      });
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.json({
        success: true,
        data: {
          uuid: qrUuid,
          url: qrUrl,
          qr_code: qrData,
          format: 'svg',
          base_url: baseUrl
        }
      });
    } else {
      // 生成PNG格式（Base64）
      qrData = await QRCode.toDataURL(qrUrl, qrOptions);
      
      res.json({
        success: true,
        data: {
          uuid: qrUuid,
          url: qrUrl,
          qr_code: qrData,
          format: 'png',
          base_url: baseUrl
        }
      });
    }

  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code'
    });
  }
});

// 获取二维码信息接口
router.get('/:uuid', async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const { format = 'png', size = 256 } = req.query;

    if (!uuid) {
      return res.status(400).json({
        success: false,
        error: 'UUID is required'
      });
    }

    // 构建二维码URL
    // 使用环境变量中的APP_URL，如果在Vercel上部署，则使用VERCEL_URL
    const baseUrl = process.env.APP_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173');
    const qrUrl = `${baseUrl}/${uuid}`;

    // 生成二维码配置
    const qrOptions = {
      width: Math.min(Math.max(Number(size), 128), 1024),
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M' as const
    };

    let qrData: string;

    if (format === 'svg') {
      qrData = await QRCode.toString(qrUrl, {
        ...qrOptions,
        type: 'svg'
      });
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(qrData);
    } else if (format === 'png') {
      const buffer = await QRCode.toBuffer(qrUrl, qrOptions);
      
      res.setHeader('Content-Type', 'image/png');
      res.send(buffer);
    } else {
      // 返回JSON格式的Base64数据
      qrData = await QRCode.toDataURL(qrUrl, qrOptions);
      
      res.json({
        success: true,
        data: {
          uuid,
          url: qrUrl,
          qr_code: qrData,
          format: 'base64'
        }
      });
    }

  } catch (error) {
    console.error('QR fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code'
    });
  }
});

export default router;