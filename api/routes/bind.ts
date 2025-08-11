import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase, type Owner } from '../lib/supabase.js';

const router = express.Router();

// 车主绑定接口
router.post('/', async (req: Request, res: Response) => {
  console.log('收到绑定请求:', JSON.stringify(req.body, null, 2));
  console.log('请求头:', JSON.stringify(req.headers, null, 2));
  
  try {
    const {
      uuid,
      license_plate,
      owner_name,
      phone,
      email,
      wechat_id,
      whatsapp_number,
      notification_preferences
    } = req.body;

    // 验证必填字段
    if (!uuid) {
      console.log('缺少UUID字段');
      return res.status(400).json({
        success: false,
        error: 'UUID is required'
      });
    }

    // 验证至少有一种联系方式
    if (!phone && !email && !wechat_id && !whatsapp_number) {
      console.log('缺少联系方式');
      return res.status(400).json({
        success: false,
        error: 'At least one contact method is required'
      });
    }

    console.log(`检查UUID是否存在: ${uuid}`);
    // 检查UUID是否已存在
    const { data: existingOwner, error: queryError } = await supabase
      .from('owners')
      .select('*')
      .eq('uuid', uuid)
      .single();
    
    if (queryError && queryError.code !== 'PGRST116') { // PGRST116是未找到记录的错误
      console.error('查询数据库错误:', queryError);
      return res.status(500).json({
        success: false,
        error: 'Database query error',
        details: queryError.message
      });
    }

    console.log('现有车主数据:', existingOwner);

    const ownerData = {
      uuid,
      license_plate: license_plate || null,
      owner_name: owner_name || null,
      phone: phone || null,
      email: email || null,
      wechat_id: wechat_id || null,
      whatsapp_number: whatsapp_number || null,
      notification_preferences: notification_preferences || {
        email: true,
        sms: false,
        whatsapp: false,
        wechat: false,
        voice: false
      },
      is_active: true
    };

    console.log('准备保存的数据:', ownerData);

    let result;
    if (existingOwner) {
      console.log('更新现有记录');
      // 更新现有记录
      result = await supabase
        .from('owners')
        .update(ownerData)
        .eq('uuid', uuid)
        .select()
        .single();
    } else {
      console.log('创建新记录');
      // 创建新记录
      result = await supabase
        .from('owners')
        .insert(ownerData)
        .select()
        .single();
    }

    if (result.error) {
      console.error('数据库操作错误:', result.error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save owner information',
        details: result.error.message
      });
    }

    console.log('保存成功:', result.data);
    res.json({
      success: true,
      data: result.data,
      message: existingOwner ? 'Owner information updated successfully' : 'Owner information saved successfully'
    });

  } catch (error) {
    console.error('绑定API错误:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// 获取车主信息接口
router.get('/:uuid', async (req: Request, res: Response) => {
  try {
    const { uuid } = req.params;

    if (!uuid) {
      return res.status(400).json({
        success: false,
        error: 'UUID is required'
      });
    }

    const { data: owner, error } = await supabase
      .from('owners')
      .select('*')
      .eq('uuid', uuid)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Owner not found'
        });
      }
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch owner information'
      });
    }

    res.json({
      success: true,
      data: owner
    });

  } catch (error) {
    console.error('Get owner API error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;