import { useState } from "react";
import { QrCode, Car, Download, Share2, Settings } from "lucide-react";
import { api } from "../lib/api";

export default function Home() {
  const [qrData, setQrData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQR = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.generateQR({ format: "png", size: 256 });
      if (response.success) {
        setQrData(response.data);
      } else {
        setError("生成二维码失败");
      }
    } catch (err) {
      setError("网络错误，请重试");
      console.error("QR generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrData?.qr_code) return;

    const link = document.createElement("a");
    link.href = qrData.qr_code;
    link.download = `car-qr-${qrData.uuid}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <Car className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Car-QR-Move</h1>
          <p className="text-gray-600">
            扫码挪车，30秒搞定
            <br />
            无需注册，无需管理，隐私安全
          </p>
        </div>

        {!qrData ? (
          <div className="space-y-4">
            <button
              onClick={generateQR}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <QrCode className="w-5 h-5" />
              )}
              {loading ? "生成中..." : "生成挪车二维码"}
            </button>

            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <img
                src={qrData.qr_code}
                alt="挪车二维码"
                className="w-48 h-48 mx-auto mb-4"
              />
            </div>

            <button
              onClick={downloadQR}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              下载二维码
            </button>

            <button
              onClick={() => setQrData(null)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition duration-200"
            >
              重新生成
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
