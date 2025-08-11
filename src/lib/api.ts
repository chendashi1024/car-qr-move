const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 重试函数
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3, retryDelay = 1000): Promise<Response> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`尝试请求 (${i + 1}/${maxRetries}): ${url}`);
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      
      // 如果是服务器错误(5xx)，则重试
      if (response.status >= 500) {
        lastError = new Error(`服务器错误: ${response.status}`);
        console.log(`服务器错误 ${response.status}，准备重试...`);
      } else {
        // 对于客户端错误(4xx)，不重试
        return response;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`网络错误: ${lastError.message}，准备重试...`);
    }
    
    // 等待一段时间后重试
    if (i < maxRetries - 1) {
      const delay = retryDelay * Math.pow(2, i); // 指数退避策略
      console.log(`等待 ${delay}ms 后重试...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
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
      // 添加超时设置
      signal: AbortSignal.timeout(30000), // 30秒超时
      ...options,
    };

    try {
      console.log(`API请求: ${url}`);
      const response = await fetchWithRetry(url, config, 3, 1000);
      
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
  async generateQR(data: { license_plate?: string; format?: string; size?: number }): Promise<ApiResponse<{ uuid: string; url: string; qr_code: string }>> {
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