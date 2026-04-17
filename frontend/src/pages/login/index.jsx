import {
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import GoogleAuthModal from "../../components/GoogleAuthModal";
import login2 from "@/assets/hero/login2.png";
import logo2 from "@/assets/logo/logo2.png";
import google from "@/assets/element/google.svg";
import IconEmail from "@/assets/element/icon email.svg";
import IconPassword from "@/assets/element/icon password.svg";
import IconEyeOpen from "@/assets/element/buka_mata.svg";
import IconEyeClosed from "@/assets/element/tutup_mata.svg";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { login, user, loading } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal state for Google auth errors
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleUserEmail, setGoogleUserEmail] = useState("");
  const [, setGoogleUserName] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  // Check for Google auth errors in URL
  useEffect(() => {
    const googleError = searchParams.get("google_error");
    const email = searchParams.get("email");
    const name = searchParams.get("name");
    const generalError = searchParams.get("error");

    if (googleError === "not_registered") {
      setGoogleUserEmail(decodeURIComponent(email || ""));
      setGoogleUserName(decodeURIComponent(name || ""));
      setShowGoogleModal(true);
      // Clean up URL
      setSearchParams({});
    }

    if (generalError === "google_auth_failed") {
      setError("Autentikasi Google gagal. Silakan coba lagi.");
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError("Email dan password harus diisi");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        // Redirect to dashboard or previous page
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from, { replace: true });
      } else if (result.needsVerification) {
        navigate("/verification-pending", {
          state: { email: result.email },
        });
      } else {
        setError(result.error);
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google/login`;
  };

  // Handle modal confirm - redirect to register with Google
  const handleModalConfirm = () => {
    setShowGoogleModal(false);
    window.location.href = `${API_URL}/auth/google/register`;
  };

  // Handle modal cancel - stay on login page
  const handleModalCancel = () => {
    setShowGoogleModal(false);
  };

  // Show loading if checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#012f72]"></div>
      </div>
    );
  }

  // Don't render if already logged in (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Google Auth Modal */}
      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        type="warning"
        title="Akun Tidak Ditemukan"
        message={`Akun Google${
          googleUserEmail ? ` (${googleUserEmail})` : ""
        } belum terdaftar. Apakah Anda ingin mendaftar dengan akun Google ini?`}
        confirmText="Ya, Daftar Sekarang"
        cancelText="Tidak, Kembali"
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />

      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left Section - Form */}
        <div className="px-6 sm:px-8 md:px-12 lg:px-16 py-8 flex flex-col justify-center">
          <header className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#012f72] font-poppins">
              Login
            </h1>
          </header>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm text-black mb-1.5"
              >
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                  <img src={IconEmail} alt="" className="w-full h-full" />
                </span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Masukkan email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full h-12 pl-11 pr-4 bg-white rounded-xl border border-neutral-400 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-[#012f72] focus:ring-1 focus:ring-[#012f72] transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm text-black mb-1.5"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                  <img src={IconPassword} alt="" className="w-full h-full" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Masukkan password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full h-12 pl-11 pr-12 bg-white rounded-xl border border-neutral-400 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-[#012f72] focus:ring-1 focus:ring-[#012f72] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
                >
                  <img
                    src={showPassword ? IconEyeOpen : IconEyeClosed}
                    alt=""
                    className="w-5 h-5"
                  />
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-[#012f72] hover:underline"
              >
                Lupa Password?
              </Link>
            </div>

            <div className="space-y-4 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-[#012f72] text-white text-base font-semibold rounded-full hover:bg-[#012559] focus:outline-none focus:ring-2 focus:ring-[#012f72] focus:ring-offset-2 transition-colors disabled:bg-[#012f72]/60 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                    Memproses...
                  </>
                ) : (
                  "Login"
                )}
              </button>

              <div className="flex items-center gap-4">
                <hr className="flex-1 border-neutral-300" />
                <span className="text-sm text-neutral-400">atau</span>
                <hr className="flex-1 border-neutral-300" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full h-12 bg-white border-2 border-[#012f72] text-[#012f72] text-base font-semibold rounded-full hover:bg-[#012f72]/5 focus:outline-none focus:ring-2 focus:ring-[#012f72] focus:ring-offset-2 transition-colors flex items-center justify-center gap-3"
              >
                <img src={google} alt="" className="w-6 h-6" />
                <span>Login with Google</span>
              </button>
            </div>
          </form>

          <p className="text-center text-base mt-6">
            <span className="text-black">Belum punya akun?</span>
            <Link
              to="/register"
              className="text-[#012f72] font-semibold hover:underline ml-1"
            >
              Register di sini
            </Link>
          </p>
        </div>

        {/* Right Section - Hero */}
        <aside className="hidden lg:flex flex-col bg-white p-8 sticky top-0 h-screen">
          <div className="flex items-start gap-4 mb-6">
            <img
              src={logo2}
              alt="Logo EduSukses"
              className="w-16 h-20 object-contain flex-shrink-0"
            />
            <div>
              <h2 className="text-3xl font-bold text-[#012f72] font-poppins mb-2">
                EduSukses
              </h2>
              <p className="text-sm text-black leading-relaxed">
                Bangun kebiasaan belajar yang konsisten dan hasil nyata lewat
                pengalaman interaktif.
              </p>
            </div>
          </div>

          <div className="flex-1 rounded-2xl overflow-hidden">
            <img
              src={login2}
              alt="Ilustrasi pembelajaran online"
              className="w-full h-full object-cover"
            />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default LoginPage;
