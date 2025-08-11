import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// 创建服务端客户端（用于后端API）
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  // 添加全局请求设置
  global: {
    fetch: (url, options) => {
      console.log(`Supabase请求: ${url}`);
      return fetch(url, {
        ...options,
        // 设置超时为30秒
        signal: AbortSignal.timeout(30000),
      });
    },
  },
  // 添加重试机制
  db: {
    schema: 'public',
  },
  realtime: {
    timeout: 30000,
  },
});

// 数据库类型定义
export interface Owner {
  id: string;
  uuid: string;
  license_plate?: string;
  owner_name?: string;
  phone?: string;
  email?: string;
  wechat_id?: string;
  whatsapp_number?: string;
  notification_preferences: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
    wechat: boolean;
    voice: boolean;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  owner_uuid: string;
  visitor_contact?: string;
  message_content: string;
  contact_method: string;
  notification_status: Record<string, string>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}