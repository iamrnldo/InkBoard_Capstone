// frontend/src/pages/forgot-password/index.jsx

import { Link } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import Login from "@/assets/hero/login.png";
import logo2 from "@/assets/logo/logo2.png";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/forgot-password",
        { email }
      );
      setSuccess(
        res.data.message || "Link reset password telah dikirim ke email Anda"
      );
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mengirim link reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Illustration */}
          <div className="hidden lg:flex justify-center items-center relative">
            <div className="relative">
              <img
                className="w-full h-auto object-contain"
                src={Login}
                alt="Education illustration"
              />
            </div>
          </div>

          {/* Right Side */}
          <div className="flex flex-col items-center lg:items-start space-y-8">
            {/* Logo and Title */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                <img
                  className="w-20 h-14 object-contain"
                  src={logo2}
                  alt="Logo"
                />
                <h1 className="text-sky-900 text-4xl lg:text-5xl font-bold">
                  EduSukses
                </h1>
              </div>
              <p className="text-black text-lg lg:text-xl mt-4">
                Bangun kebiasaan belajar yang konsisten
                <br />
                dan hasil nyata lewat pengalaman interaktif.
              </p>
            </div>

            {/* Form */}
            <div className="w-full max-w-md space-y-6">
              <h2 className="text-black text-xl font-medium">Lupa Password</h2>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-base font-medium text-black mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-900 focus:border-transparent outline-none transition"
                    placeholder="nama@email.com"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-8 py-4 bg-sky-900 rounded-lg hover:bg-sky-800 transition disabled:bg-sky-600 disabled:cursor-not-allowed"
                >
                  <span className="text-white text-xl font-semibold">
                    {loading ? "Memproses..." : "Kirim Link Reset"}
                  </span>
                </button>
              </form>

              <div className="text-center pt-4">
                <p className="text-black text-lg">
                  Ingat password?{" "}
                  <Link
                    to="/login"
                    className="text-sky-900 font-semibold underline hover:text-sky-700"
                  >
                    Masuk di sini
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
