-- Car-QR-Move Database Schema
-- 创建车主信息表
CREATE TABLE IF NOT EXISTS owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uuid VARCHAR(36) UNIQUE NOT NULL, -- 车主唯一标识符
  license_plate VARCHAR(20), -- 车牌号（可选）
  owner_name VARCHAR(100), -- 车主姓名（可选）
  phone VARCHAR(20), -- 手机号
  email VARCHAR(255), -- 邮箱
  wechat_id VARCHAR(100), -- 微信号
  whatsapp_number VARCHAR(20), -- WhatsApp号码
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "whatsapp": false, "wechat": false, "voice": false}', -- 通知偏好
  is_active BOOLEAN DEFAULT true, -- 是否激活
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建留言记录表
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_uuid VARCHAR(36) NOT NULL REFERENCES owners(uuid) ON DELETE CASCADE,
  visitor_contact VARCHAR(255), -- 访客联系方式（手机/邮箱等）
  message_content TEXT NOT NULL, -- 留言内容
  contact_method VARCHAR(20) DEFAULT 'unknown', -- 联系方式类型：phone, email, wechat, whatsapp
  notification_status JSONB DEFAULT '{}', -- 通知发送状态 {"email": "sent", "sms": "failed"}
  ip_address INET, -- 访客IP地址
  user_agent TEXT, -- 访客浏览器信息
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_owners_uuid ON owners(uuid);
CREATE INDEX IF NOT EXISTS idx_owners_phone ON owners(phone);
CREATE INDEX IF NOT EXISTS idx_owners_email ON owners(email);
CREATE INDEX IF NOT EXISTS idx_messages_owner_uuid ON messages(owner_uuid);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 启用行级安全策略 (RLS)
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- owners表策略：允许匿名用户读取和插入，允许认证用户更新自己的记录
CREATE POLICY "Allow anonymous read access" ON owners
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous insert" ON owners
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update own records" ON owners
  FOR UPDATE USING (true) WITH CHECK (true);

-- messages表策略：允许匿名用户插入留言，允许读取（用于统计）
CREATE POLICY "Allow anonymous insert messages" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous read messages" ON messages
  FOR SELECT USING (true);

-- 授权给anon和authenticated角色
GRANT SELECT, INSERT, UPDATE ON owners TO anon;
GRANT SELECT, INSERT, UPDATE ON owners TO authenticated;
GRANT SELECT, INSERT ON messages TO anon;
GRANT SELECT, INSERT ON messages TO authenticated;

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为owners表创建更新时间触发器
CREATE TRIGGER update_owners_updated_at
  BEFORE UPDATE ON owners
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();