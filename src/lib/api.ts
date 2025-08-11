const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // 生成二维码
  async generateQR(data: { uuid?: string; format?: string; size?: number }): Promise<ApiResponse<{ uuid: string; qr_code: string }>> {
    return this.request('/api/qr/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 获取二维码
  async getQR(uuid: string, format = 'json', size = 256): Promise<ApiResponse<{ qr_code: string }>> {
    const params = new URLSearchParams({ format, size: size.toString() });
    return this.request(`/api/qr/${uuid}?${params}`);
  }

  // 绑定车主信息
  async bindOwner(data: {
    uuid: string;
    license_plate?: string;
    owner_name?: string;
    phone?: string;
    email?: string;
    wechat_id?: string;
    whatsapp_number?: string;
    notification_preferences?: {
      email: boolean;
      sms: boolean;
      whatsapp: boolean;
      wechat: boolean;
      voice: boolean;
    };
  }): Promise<ApiResponse<any>> {
    return this.request('/api/bind', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 获取车主信息
  async getOwner(uuid: string): Promise<ApiResponse<any>> {
    return this.request(`/api/bind/${uuid}`);
  }

  // 发送留言
  async sendMessage(data: {
    owner_uuid: string;
    visitor_contact?: string;
    message_content: string;
    contact_method?: string;
  }): Promise<ApiResponse<any>> {
    return this.request('/api/message', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 获取留言历史
  async getMessages(uuid: string, limit = 10, offset = 0): Promise<ApiResponse<any[]>> {
    const params = new URLSearchParams({ 
      limit: limit.toString(), 
      offset: offset.toString() 
    });
    return this.request(`/api/message/${uuid}?${params}`);
  }
}

export const api = new ApiClient(API_BASE_URL);