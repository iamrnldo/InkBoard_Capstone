/* eslint-disable react-hooks/exhaustive-deps */
/*for (let index = 0; index < array.length; index++) {
  const element = array[index];
}eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import logo2 from "@/assets/logo/logo2.png";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying, success, error
  const [message, setMessage] = useState("Memverifikasi email Anda...");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Token verifikasi tidak valid");
      return;
    }

    verifyEmail(token);
  }, [searchParams,]);

  const verifyEmail = async (token) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/auth/verify-email/${token}`
      );

      setStatus("success");
      setMessage(res.data.message);

      // Save token for auto-login
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate("/dashboard");
        window.location.reload();
      }, 3000);
    } catch (err) {
      setStatus("error");
      setMessage(
        err.response?.data?.message ||
          "Verifikasi gagal. Token mungkin sudah kedaluwarsa."
      );
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

        {/* Status Icon */}
        <div className="text-center mb-6">
          {status === "verifying" && (
            <div className="inline-block">
              <svg
                className="animate-spin h-16 w-16 text-sky-900"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          )}

          {status === "success" && (
            <div className="inline-block">
              <svg
                className="h-16 w-16 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}

          {status === "error" && (
            <div className="inline-block">
              <svg
                className="h-16 w-16 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Message */}
        <div className="text-center">
          <h2
            className={`text-2xl font-bold mb-4 ${
              status === "success"
                ? "text-green-600"
                : status === "error"
                ? "text-red-600"
                : "text-sky-900"
            }`}
          >
            {status === "verifying" && "Memverifikasi Email"}
            {status === "success" && "Verifikasi Berhasil!"}
            {status === "error" && "Verifikasi Gagal"}
          </h2>

          <p className="text-gray-700 mb-6">{message}</p>

          {status === "success" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="text-green-800 text-sm">
                Anda akan diarahkan ke dashboard dalam beberapa detik...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <button
                onClick={() => navigate("/login")}
                className="w-full px-6 py-3 bg-sky-900 text-white rounded-lg hover:bg-sky-800 transition"
              >
                Kembali ke Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="w-full px-6 py-3 bg-white border-2 border-sky-900 text-sky-900 rounded-lg hover:bg-sky-50 transition"
              >
                Daftar Ulang
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
