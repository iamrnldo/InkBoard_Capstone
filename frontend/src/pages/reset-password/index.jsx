import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import Login from "@/assets/hero/login.png";
import logo2 from "@/assets/logo/logo2.png";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) return setError("Password tidak cocok");
    if (password.length < 6) return setError("Password minimal 6 karakter");

    setLoading(true);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/reset-password",
        {
          token,
          password,
        }
      );
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.response?.data?.message || "Gagal reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="hidden lg:flex justify-center items-center">
            <img
              className="w-full h-auto object-contain"
              src={Login}
              alt="Login"
            />
          </div>

          <div className="flex flex-col items-center lg:items-start space-y-8">
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

            <div className="w-full max-w-md space-y-6">
              <h2 className="text-black text-xl font-medium">
                Reset Password Baru
              </h2>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                  {success}{" "}
                  <Link to="/login" className="underline font-bold">
                    Masuk sekarang
                  </Link>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-base font-medium text-black mb-2">
                    Password Baru
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-900 outline-none"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-base font-medium text-black mb-2">
                    Konfirmasi Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-900 outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full px-8 py-4 bg-sky-900 rounded-lg hover:bg-sky-800 disabled:bg-sky-600 text-white text-xl font-semibold"
                >
                  {loading ? "Memproses..." : "Simpan Password Baru"}
                </button>
              </form>

              <div className="text-center pt-4">
                <Link to="/login" className="text-sky-900 hover:underline">
                  ← Kembali ke login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
