import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wfplpwgiavgjjuredhey.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmcGxwd2dpYXZnamp1cmVkaGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4MTkwOTMsImV4cCI6MjA3MDM5NTA5M30.awZmZa_PyFCkwYpJMX2izQpKdr-pyExgEHicKaNIo8o';

// 创建前端客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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