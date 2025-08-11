import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Car, Send, MessageCircle, Phone, Mail, Settings, Clock } from 'lucide-react';
import { api } from '../lib/api';
import type { Owner, Message } from '../lib/supabase';

export default function VisitorMessage() {
  const { uuid } = useParams<{ uuid: string }>();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const [formData, setFormData] = useState({
    visitor_contact: '',
    message_content: '',
    contact_method: 'unknown'
  });

  useEffect(() => {
    if (uuid) {
      loadOwnerData();
    }
  }, [uuid]);

  const loadOwnerData = async () => {
    if (!uuid) return;
    
    setLoading(true);
    try {
      const response = await api.getOwner(uuid);
      if (response.success && response.data) {
        setOwner(response.data);
      } else {
        setError('车主信息未找到，请确认二维码是否正确');
      }
    } catch (err) {
      setError('车主信息未找到，请确认二维码是否正确');
      console.error('Load owner error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!uuid) return;
    
    try {
      const response = await api.getMessages(uuid, 5);
      if (response.success) {
        setMessages(response.data || []);
      }
    } catch (err) {
      console.error('Load messages error:', err);
    }
  };

  const detectContactMethod = (contact: string) => {
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
      return 'email';
    } else if (/^[1][3-9]\d{9}$/.test(contact)) {
      return 'phone';
    } else if (contact.includes('@')) {
      return 'wechat';
    }
    return 'unknown';
  };

  const handleContactChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      visitor_contact: value,
      contact_method: detectContactMethod(value)
    }));
  };

  const validateForm = () => {
    if (!formData.message_content.trim()) {
      setError('请输入留言内容');
      return false;
    }
    
    if (formData.message_content.length > 500) {
      setError('留言内容不能超过500字');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uuid || !validateForm()) {
      return;
    }
    
    setSending(true);
    setError(null);
    
    try {
      const response = await api.sendMessage({
        owner_uuid: uuid,
        visitor_contact: formData.visitor_contact || undefined,
        message_content: formData.message_content.trim(),
        contact_method: formData.contact_method
      });
      
      if (response.success) {
        setSuccess(true);
        setFormData({
          visitor_contact: '',
          message_content: '',
          contact_method: 'unknown'
        });
        
        // 3秒后隐藏成功提示
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
        
        // 刷新留言历史
        if (showHistory) {
          loadMessages();
        }
      } else {
        setError('发送失败，请重试');
      }
    } catch (err) {
      setError('网络错误，请重试');
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  const toggleHistory = () => {
    if (!showHistory) {
      loadMessages();
    }
    setShowHistory(!showHistory);
  };

  const getContactMethods = () => {
    if (!owner) return [];
    
    const methods = [];
    if (owner.phone) methods.push({ type: 'phone', value: owner.phone, icon: Phone });
    if (owner.email) methods.push({ type: 'email', value: owner.email, icon: Mail });
    if (owner.wechat_id) methods.push({ type: 'wechat', value: owner.wechat_id, icon: MessageCircle });
    if (owner.whatsapp_number) methods.push({ type: 'whatsapp', value: owner.whatsapp_number, icon: MessageCircle });
    
    return methods;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (error && !owner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">首次使用？</h2>
          <p className="text-gray-600 mb-6">
            这是您的专属挪车二维码！<br/>
            请先绑定您的联系方式，方便他人联系您挪车。
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = `/${uuid}/setup`}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              立即绑定车主信息
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">留言发送成功！</h2>
          <p className="text-gray-600 mb-4">
            您的留言已发送给车主，车主会尽快处理挪车请求。
          </p>
          <div className="space-y-2">
            <button
              onClick={() => setSuccess(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              继续留言
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    );
  }

  const contactMethods = getContactMethods();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* 车主信息卡片 */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {owner?.owner_name || '车主'}
              </h1>
              {owner?.license_plate && (
                <p className="text-sm text-gray-600">{owner.license_plate}</p>
              )}
            </div>
          </div>
          
          {contactMethods.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">联系方式：</p>
              <div className="grid grid-cols-1 gap-2">
                {contactMethods.map(({ type, value, icon: Icon }) => (
                  <div key={type} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <Icon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 留言表单 */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">发送挪车请求</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                您的联系方式（可选）
              </label>
              <input
                type="text"
                value={formData.visitor_contact}
                onChange={(e) => handleContactChange(e.target.value)}
                placeholder="手机号、邮箱或微信号"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                留下联系方式，车主可以直接回复您
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                留言内容 *
              </label>
              <textarea
                value={formData.message_content}
                onChange={(e) => setFormData(prev => ({ ...prev, message_content: e.target.value }))}
                placeholder="请描述您的挪车需求，如：您好，您的车挡住了我的车，麻烦挪一下，谢谢！"
                rows={4}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">
                  请礼貌用词，车主会尽快处理
                </p>
                <p className="text-xs text-gray-500">
                  {formData.message_content.length}/500
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {sending ? '发送中...' : '发送留言'}
            </button>
          </form>
        </div>

        {/* 留言历史 */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <button
            onClick={toggleHistory}
            className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition duration-200"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-700">最近留言</span>
            </div>
            <div className={`transform transition-transform ${showHistory ? 'rotate-180' : ''}`}>
              ▼
            </div>
          </button>
          
          {showHistory && (
            <div className="mt-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500 py-4">暂无留言记录</p>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-800 mb-2">{message.message_content}</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>
                        {message.visitor_contact ? `来自: ${message.visitor_contact}` : '匿名访客'}
                      </span>
                      <span>{new Date(message.created_at).toLocaleString('zh-CN')}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 车主设置入口 */}
        {owner && (
          <div className="bg-white rounded-2xl shadow-xl p-4">
            <button
              onClick={() => window.open(`/${uuid}/setup`, '_blank')}
              className="w-full flex items-center justify-center gap-2 p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200"
            >
              <Settings className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">车主设置</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}