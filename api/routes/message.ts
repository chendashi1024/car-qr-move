import express, { Request, Response } from 'express';
import { supabase, type Owner, type Message } from '../lib/supabase.js';
import { sendNotification } from '../services/notification.js';

const router = express.Router();

// 发送留言接口
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      owner_uuid,
      visitor_contact,
      message_content,
      contact_method = 'unknown'
    } = req.body;

    // 验证必填字段
    if (!owner_uuid || !message_content) {
      return res.status(400).json({
        success: false,
        error: 'Owner UUID and message content are required'
      });
    }

    // 验证留言长度
    if (message_content.length > 500) {
      return res.status(400).json({
        success: false,
        error: 'Message content too long (max 500 characters)'
      });
    }

    // 获取车主信息
    const { data: owner, error: ownerError } = await supabase
      .from('owners')
      .select('*')
      .eq('uuid', owner_uuid)
      .eq('is_active', true)
      .single();

    if (ownerError || !owner) {
      return res.status(404).json({
        success: false,
        error: 'Owner not found or inactive'
      });
    }

    // 获取客户端信息
    const ip_address = req.ip || req.connection.remoteAddress || null;
    const user_agent = req.get('User-Agent') || null;

    // 保存留言到数据库
    const messageData = {
      owner_uuid,
      visitor_contact: visitor_contact || null,
      message_content,
      contact_method,
      notification_status: {},
      ip_address,
      user_agent
    };

    const { data: savedMessage, error: messageError } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (messageError) {
      console.error('Failed to save message:', messageError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save message'
      });
    }

    // 发送通知
    const notificationResults = await sendNotification(owner, {
      message_content,
      visitor_contact: visitor_contact || '匿名访客',
      contact_method
    });

    // 更新通知状态
    if (notificationResults && Object.keys(notificationResults).length > 0) {
      await supabase
        .from('messages')
        .update({ notification_status: notificationResults })
        .eq('id', savedMessage.id);
    }

    res.json({
      success: true,
      data: {
        message: savedMessage,
        notification_results: notificationResults
      },
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Message API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 获取车主的留言历史
router.get('/:uuid', async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    if (!uuid) {
      return res.status(400).json({
        success: false,
        error: 'UUID is required'
      });
    }

    // 验证车主是否存在
    const { data: owner, error: ownerError } = await supabase
      .from('owners')
      .select('id')
      .eq('uuid', uuid)
      .eq('is_active', true)
      .single();

    if (ownerError || !owner) {
      return res.status(404).json({
        success: false,
        error: 'Owner not found'
      });
    }

    // 获取留言历史
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('owner_uuid', uuid)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (messagesError) {
      console.error('Failed to fetch messages:', messagesError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch messages'
      });
    }

    res.json({
      success: true,
      data: messages || [],
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: messages?.length || 0
      }
    });

  } catch (error) {
    console.error('Get messages API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;