import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { type Owner } from '../lib/supabase.js';

// 初始化SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// 初始化Twilio
let twilioClient: any = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

interface NotificationData {
  message_content: string;
  visitor_contact: string;
  contact_method: string;
}

interface NotificationResult {
  [key: string]: 'sent' | 'failed' | 'disabled';
}

// 发送邮件通知
async function sendEmailNotification(owner: Owner, data: NotificationData): Promise<'sent' | 'failed' | 'disabled'> {
  try {
    if (!process.env.ENABLE_EMAIL || process.env.ENABLE_EMAIL !== 'true') {
      return 'disabled';
    }

    if (!owner.email || !process.env.SENDGRID_API_KEY) {
      return 'failed';
    }

    const msg = {
      to: owner.email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@car-qr-move.com',
      subject: '🚗 您有新的挪车请求',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🚗 挪车通知</h2>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>留言内容：</strong></p>
            <p style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #2563eb;">
              ${data.message_content}
            </p>
          </div>
          <div style="background: #f1f5f9; padding: 15px; border-radius: 8px;">
            <p><strong>访客联系方式：</strong> ${data.visitor_contact}</p>
            <p><strong>联系方式类型：</strong> ${data.contact_method}</p>
            <p><strong>时间：</strong> ${new Date().toLocaleString('zh-CN')}</p>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px;">
            此邮件由 Car-QR-Move 自动发送，请及时处理挪车请求。
          </p>
        </div>
      `
    };

    await sgMail.send(msg);
    console.log(`Email sent to ${owner.email}`);
    return 'sent';
  } catch (error) {
    console.error('Email notification failed:', error);
    return 'failed';
  }
}

// 发送短信通知
async function sendSMSNotification(owner: Owner, data: NotificationData): Promise<'sent' | 'failed' | 'disabled'> {
  try {
    if (!process.env.ENABLE_SMS || process.env.ENABLE_SMS !== 'true') {
      return 'disabled';
    }

    if (!owner.phone || !twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
      return 'failed';
    }

    const message = `🚗 挪车通知\n\n留言：${data.message_content}\n\n访客联系方式：${data.visitor_contact}\n时间：${new Date().toLocaleString('zh-CN')}\n\n请及时处理挪车请求。`;

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: owner.phone
    });

    console.log(`SMS sent to ${owner.phone}`);
    return 'sent';
  } catch (error) {
    console.error('SMS notification failed:', error);
    return 'failed';
  }
}

// 发送WhatsApp通知
async function sendWhatsAppNotification(owner: Owner, data: NotificationData): Promise<'sent' | 'failed' | 'disabled'> {
  try {
    if (!process.env.ENABLE_WHATSAPP || process.env.ENABLE_WHATSAPP !== 'true') {
      return 'disabled';
    }

    if (!owner.whatsapp_number || !twilioClient || !process.env.TWILIO_WHATSAPP_NUMBER) {
      return 'failed';
    }

    const message = `🚗 *挪车通知*\n\n*留言：*\n${data.message_content}\n\n*访客联系方式：* ${data.visitor_contact}\n*时间：* ${new Date().toLocaleString('zh-CN')}\n\n请及时处理挪车请求。`;

    await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
      to: `whatsapp:${owner.whatsapp_number}`
    });

    console.log(`WhatsApp sent to ${owner.whatsapp_number}`);
    return 'sent';
  } catch (error) {
    console.error('WhatsApp notification failed:', error);
    return 'failed';
  }
}

// 发送微信通知（企业微信）
async function sendWeChatNotification(owner: Owner, data: NotificationData): Promise<'sent' | 'failed' | 'disabled'> {
  try {
    if (!process.env.ENABLE_WECHAT || process.env.ENABLE_WECHAT !== 'true') {
      return 'disabled';
    }

    if (!owner.wechat_id || !process.env.WECHAT_CORP_ID || !process.env.WECHAT_CORP_SECRET) {
      return 'failed';
    }

    // 这里需要实现企业微信API调用
    // 由于企业微信API较复杂，这里先返回disabled
    console.log('WeChat notification not implemented yet');
    return 'disabled';
  } catch (error) {
    console.error('WeChat notification failed:', error);
    return 'failed';
  }
}

// 发送语音通知
async function sendVoiceNotification(owner: Owner, data: NotificationData): Promise<'sent' | 'failed' | 'disabled'> {
  try {
    if (!process.env.ENABLE_VOICE || process.env.ENABLE_VOICE !== 'true') {
      return 'disabled';
    }

    if (!owner.phone || !twilioClient || !process.env.TWILIO_VOICE_NUMBER) {
      return 'failed';
    }

    const message = `您好，您有新的挪车请求。留言内容：${data.message_content}。访客联系方式：${data.visitor_contact}。请及时处理挪车请求。`;

    await twilioClient.calls.create({
      twiml: `<Response><Say language="zh-CN">${message}</Say></Response>`,
      from: process.env.TWILIO_VOICE_NUMBER,
      to: owner.phone
    });

    console.log(`Voice call made to ${owner.phone}`);
    return 'sent';
  } catch (error) {
    console.error('Voice notification failed:', error);
    return 'failed';
  }
}

// 主通知发送函数
export async function sendNotification(owner: Owner, data: NotificationData): Promise<NotificationResult> {
  const results: NotificationResult = {};
  const preferences = owner.notification_preferences;

  // 并行发送所有启用的通知方式
  const promises = [];

  if (preferences.email) {
    promises.push(
      sendEmailNotification(owner, data).then(result => {
        results.email = result;
      })
    );
  }

  if (preferences.sms) {
    promises.push(
      sendSMSNotification(owner, data).then(result => {
        results.sms = result;
      })
    );
  }

  if (preferences.whatsapp) {
    promises.push(
      sendWhatsAppNotification(owner, data).then(result => {
        results.whatsapp = result;
      })
    );
  }

  if (preferences.wechat) {
    promises.push(
      sendWeChatNotification(owner, data).then(result => {
        results.wechat = result;
      })
    );
  }

  if (preferences.voice) {
    promises.push(
      sendVoiceNotification(owner, data).then(result => {
        results.voice = result;
      })
    );
  }

  // 等待所有通知发送完成
  await Promise.all(promises);

  console.log('Notification results:', results);
  return results;
}