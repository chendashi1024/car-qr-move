import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Car,
  Save,
  ArrowLeft,
  Mail,
  Phone,
  MessageCircle,
  Bell,
} from "lucide-react";
import { api } from "../lib/api";
import type { Owner } from "../lib/supabase";

export default function OwnerSetup() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [owner, setOwner] = useState<Partial<Owner> | null>(null);

  const [formData, setFormData] = useState({
    license_plate: "",
    phone: "",
    email: "",
    wechat_id: "",
    whatsapp_number: "",
    notification_preference: "email", // 改为单一字符串，默认为邮件通知
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
        // 兼容旧数据格式
        let preferredMethod = "email";
        if (response.data.notification_preferences) {
          // 从旧的多选格式中找出第一个为true的选项
          const methods = Object.entries(
            response.data.notification_preferences
          );
          const enabledMethod = methods.find(
            ([_, enabled]) => enabled === true
          );
          if (enabledMethod) {
            preferredMethod = enabledMethod[0];
          }
        } else if (response.data.notification_preference) {
          // 如果已经是新格式
          preferredMethod = response.data.notification_preference;
        }

        setFormData({
          license_plate: response.data.license_plate || "",
          phone: response.data.phone || "",
          email: response.data.email || "",
          wechat_id: response.data.wechat_id || "",
          whatsapp_number: response.data.whatsapp_number || "",
          notification_preference: preferredMethod,
        });
      }
    } catch (err) {
      console.log("Owner not found, creating new one");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePreferenceChange = (method: string) => {
    setFormData((prev) => ({
      ...prev,
      notification_preference: method,
    }));
  };

  const validateForm = () => {
    const {
      phone,
      email,
      wechat_id,
      whatsapp_number,
      notification_preference,
    } = formData;

    // 车牌号不能为空
    if (!formData.license_plate) {
      setError("请输入车牌号");
      return false;
    }

    // 检查选择的通知方式是否填写了对应的联系信息
    if (notification_preference === "email" && !email) {
      setError("您选择了邮件通知，请填写邮箱地址");
      return false;
    }

    if (notification_preference === "voice" && !phone) {
      setError("您选择了电话通知，请填写手机号码");
      return false;
    }

    // if (notification_preference === "wechat" && !wechat_id) {
    //   setError("您选择了微信通知，请填写微信号");
    //   return false;
    // }

    if (notification_preference === "whatsapp" && !whatsapp_number) {
      setError("您选择了WhatsApp通知，请填写WhatsApp号码");
      return false;
    }

    // 验证格式
    if (phone && !/^[1][3-9]\d{9}$/.test(phone)) {
      setError("请输入正确的手机号码");
      return false;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("请输入正确的邮箱地址");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uuid || !validateForm()) {
      console.log('表单验证失败');
      return;
    }
    
    setSaving(true);
    setError(null);

    try {
      console.log('提交表单数据:', formData);
      // 转换为API期望的格式
      const apiData = {
        uuid,
        license_plate: formData.license_plate,
        phone: formData.phone,
        email: formData.email,
        wechat_id: formData.wechat_id,
        whatsapp_number: formData.whatsapp_number,
        notification_preferences: {
          email: formData.notification_preference === "email",
          sms: formData.notification_preference === "sms",
          whatsapp: formData.notification_preference === "whatsapp",
          wechat: formData.notification_preference === "wechat",
          voice: formData.notification_preference === "voice",
        },
      };

      console.log('准备发送到API的数据:', apiData);
      const response = await api.bindOwner(apiData);
      console.log('API响应:', response);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate(`/${uuid}`);
        }, 2000);
      } else {
        setError(response.error || response.message || "保存失败，请重试");
      }
    } catch (err) {
      console.error('保存错误:', err);
      setError(err instanceof Error ? err.message : "网络错误，请重试");
    } finally {
      setSaving(false);
    }
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

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">设置完成！</h2>
          <p className="text-gray-600 mb-4">
            您的联系方式已保存，访客现在可以通过扫描二维码联系您挪车。
          </p>
          <p className="text-sm text-gray-500">正在跳转到留言页面...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">车主信息设置</h1>
              <p className="text-sm text-gray-600">
                设置您的联系方式和通知偏好
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 基本信息 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">基本信息</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  车牌号
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.license_plate}
                  onChange={(e) =>
                    handleInputChange("license_plate", e.target.value)
                  }
                  placeholder="如：京A12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 通知偏好 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">
                通知偏好
                <span className="text-red-500 ml-1">*</span>
              </h3>
              <p className="text-xs text-gray-500">选择您希望接收通知的方式</p>

              <div className="space-y-2">
                {[
                  { key: "voice", label: "电话通知", icon: Phone },
                  { key: "email", label: "邮件通知", icon: Mail },
                  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
                  // { key: 'sms', label: '短信通知', icon: Phone },
                  // { key: 'wechat', label: '微信通知', icon: MessageCircle },
                ].map(({ key, label, icon: Icon }) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="notification_preference"
                      checked={formData.notification_preference === key}
                      onChange={() => handlePreferenceChange(key)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <Icon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 联系方式 - 根据通知偏好动态显示 */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">联系方式</h3>
              <p className="text-xs text-gray-500">
                请填写您选择的通知方式对应的联系信息
              </p>

              {formData.notification_preference === "email" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Mail className="w-4 h-4 inline mr-1" />
                    邮箱
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {(formData.notification_preference === "sms" ||
                formData.notification_preference === "voice") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Phone className="w-4 h-4 inline mr-1" />
                    手机号
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="13800138000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {formData.notification_preference === "wechat" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MessageCircle className="w-4 h-4 inline mr-1" />
                    微信号
                  </label>
                  <input
                    type="text"
                    value={formData.wechat_id}
                    onChange={(e) =>
                      handleInputChange("wechat_id", e.target.value)
                    }
                    placeholder="您的微信号"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {formData.notification_preference === "whatsapp" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MessageCircle className="w-4 h-4 inline mr-1" />
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp_number}
                    onChange={(e) =>
                      handleInputChange("whatsapp_number", e.target.value)
                    }
                    placeholder="+86 13800138000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? "保存中..." : owner ? "更新信息" : "保存信息"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
