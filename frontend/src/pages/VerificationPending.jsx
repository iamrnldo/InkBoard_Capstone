import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import logo2 from "@/assets/logo/logo2.png";

const VerificationPending = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleResendEmail = async () => {
    if (!email) {
      setError("Email tidak ditemukan");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/resend-verification",
        { email }
      );

      setMessage(res.data.message);
    } catch (err) {
      setError(
        err.response?.data?.message || "Gagal mengirim ulang email verifikasi"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <img className="w-16 h-12 object-contain" src={logo2} alt="Logo" />
          <h1 className="text-sky-900 text-3xl font-bold">EduSukses</h1>
        </div>

        {/* Email Icon */}
        <div className="text-center mb-6">
          <div className="inline-block bg-blue-100 rounded-full p-6">
            <svg
              className="h-16 w-16 text-sky-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-sky-900 text-center mb-4">
          Verifikasi Email Anda
        </h2>

        {/* Description */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-gray-700 text-center">
            Kami telah mengirimkan link verifikasi ke:
          </p>
          <p className="text-sky-900 font-semibold text-center mt-2">{email}</p>
        </div>

        <p className="text-gray-600 text-center mb-6">
          Silakan cek inbox atau folder spam Anda dan klik link verifikasi untuk
          mengaktifkan akun.
        </p>

        {/* Success Message */}
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 mb-4 text-sm text-center">
            {message}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm text-center">
            {error}
          </div>
        )}

        {/* Resend Button */}
        <button
          onClick={handleResendEmail}
          disabled={loading}
          className="w-full px-6 py-3 bg-sky-900 text-white rounded-lg hover:bg-sky-800 transition disabled:bg-sky-600 disabled:cursor-not-allowed mb-4"
        >
          {loading ? "Mengirim..." : "Kirim Ulang Email Verifikasi"}
        </button>

        {/* Back to Login */}
        <button
          onClick={() => navigate("/login")}
          className="w-full px-6 py-3 bg-white border-2 border-sky-900 text-sky-900 rounded-lg hover:bg-sky-50 transition"
        >
          Kembali ke Login
        </button>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Tidak menerima email?</p>
          <p className="mt-1">
            • Cek folder spam/junk
            <br />
            • Pastikan email sudah benar
            <br />• Tunggu beberapa menit lalu klik "Kirim Ulang"
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerificationPending;
