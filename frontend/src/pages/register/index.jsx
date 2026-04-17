import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import GoogleAuthModal from "../../components/GoogleAuthModal";
import Register from "@/assets/hero/login2.png";
import logo2 from "@/assets/logo/logo2.png";
import google from "@/assets/element/google.svg";

// Import icons
import IconUser from "@/assets/element/icon user.svg";
import IconPhone from "@/assets/element/icon telp.svg";
import IconEmail from "@/assets/element/icon email.svg";
import IconPassword from "@/assets/element/icon password.svg";
import IconDropdown from "@/assets/element/icon dropdown.svg";
import IconEyeOpen from "@/assets/element/buka_mata.svg";
import IconEyeClosed from "@/assets/element/tutup_mata.svg";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Reusable Input Component
const InputField = ({
  icon,
  type = "text",
  id,
  name,
  placeholder,
  value,
  onChange,
  required = false,
  minLength,
}) => (
  <div className="relative">
    <span className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
      <img src={icon} alt="" className="w-full h-full" aria-hidden="true" />
    </span>
    <input
      type={type}
      id={id}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      minLength={minLength}
      className="w-full h-12 pl-11 pr-4 bg-white rounded-xl border border-neutral-400 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-[#012f72] focus:ring-1 focus:ring-[#012f72] transition-colors"
    />
  </div>
);

// Reusable Select Component
const SelectField = ({
  id,
  name,
  value,
  onChange,
  placeholder,
  options,
  required = false,
}) => (
  <div className="relative">
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className={`w-full h-12 px-4 pr-10 bg-white rounded-xl border border-neutral-400 text-sm focus:outline-none focus:border-[#012f72] focus:ring-1 focus:ring-[#012f72] appearance-none cursor-pointer transition-colors ${
        value ? "text-black" : "text-neutral-400"
      }`}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option.value} value={option.value} className="text-black">
          {option.label}
        </option>
      ))}
    </select>
    <span className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none">
      <img
        src={IconDropdown}
        alt=""
        className="w-full h-full"
        aria-hidden="true"
      />
    </span>
  </div>
);

// Password Input Component
const PasswordField = ({
  id,
  name,
  placeholder,
  value,
  onChange,
  show,
  onToggle,
  minLength,
}) => (
  <div className="relative">
    <span className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
      <img
        src={IconPassword}
        alt=""
        className="w-full h-full"
        aria-hidden="true"
      />
    </span>
    <input
      type={show ? "text" : "password"}
      id={id}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required
      minLength={minLength}
      className="w-full h-12 pl-11 pr-12 bg-white rounded-xl border border-neutral-400 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-[#012f72] focus:ring-1 focus:ring-[#012f72] transition-colors"
    />
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#012f72] rounded"
      aria-label="Toggle password visibility"
    >
      <img
        src={show ? IconEyeOpen : IconEyeClosed}
        alt=""
        className="w-5 h-5"
        aria-hidden="true"
      />
    </button>
  </div>
);

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { register, loginWithToken } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "",
    kelas: "",
    peminatan: "",
    school: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Modal state for Google auth
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleToken, setGoogleToken] = useState("");

  // Check for Google auth errors in URL
  useEffect(() => {
    const googleError = searchParams.get("google_error");
    const token = searchParams.get("token");

    if (googleError === "already_registered" && token) {
      setGoogleToken(token);
      setShowGoogleModal(true);
      // Clean up URL
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

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Nama lengkap harus diisi");
      return false;
    }

    if (!formData.email.trim()) {
      setError("Email harus diisi");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Format email tidak valid");
      return false;
    }

    if (!formData.password) {
      setError("Password harus diisi");
      return false;
    }

    if (formData.password.length < 8) {
      setError("Password minimal 8 karakter");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password tidak cocok");
      return false;
    }

    if (!agreeTerms) {
      setError("Anda harus menyetujui syarat dan ketentuan");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const result = await register({
        name: formData.name.trim(),
        phone: formData.phone || null,
        email: formData.email.toLowerCase().trim(),
        gender: formData.gender || null,
        kelas: formData.kelas || null,
        peminatan: formData.peminatan || null,
        school: formData.school || null,
        password: formData.password,
      });

      if (result.success) {
        navigate("/verification-pending", {
          state: { email: formData.email },
        });
      } else {
        setError(result.error || "Registrasi gagal. Silakan coba lagi.");
      }
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = `${API_URL}/auth/google/register`;
  };

  // Handle modal confirm - login with existing Google account
  const handleModalConfirm = () => {
    setShowGoogleModal(false);
    if (googleToken && loginWithToken) {
      // Use the token to login directly
      loginWithToken(googleToken);
      navigate("/dashboard");
    } else {
      // Fallback: redirect to Google login
      window.location.href = `${API_URL}/auth/google/login`;
    }
  };

  // Handle modal cancel - stay on register page
  const handleModalCancel = () => {
    setShowGoogleModal(false);
    setGoogleToken("");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Google Auth Modal */}
      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        type="info"
        title="Akun Sudah Terdaftar"
        message="Akun Google ini sudah terdaftar sebelumnya. Apakah Anda ingin login dengan akun Google ini?"
        confirmText="Ya, Login Sekarang"
        cancelText="Tidak, Kembali"
        onConfirm={handleModalConfirm}
        onCancel={handleModalCancel}
      />

      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left Section - Form */}
        <div className="px-6 sm:px-8 md:px-12 lg:px-16 py-8 overflow-y-auto">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#012f72] font-poppins">
              Register
            </h1>
          </header>

          {/* Error Display */}
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

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Data Pribadi Section */}
            <section>
              <h2 className="text-base font-semibold text-[#012f72] mb-4">
                Data Pribadi
              </h2>

              <div className="space-y-4">
                {/* Nama Lengkap */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm text-black mb-1.5"
                  >
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <InputField
                    icon={IconUser}
                    id="name"
                    name="name"
                    placeholder="Masukkan nama lengkap"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* No. Telepon */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm text-black mb-1.5"
                  >
                    No. Telepon
                  </label>
                  <InputField
                    icon={IconPhone}
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="Masukkan nomor telepon"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm text-black mb-1.5"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <InputField
                    icon={IconEmail}
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Masukkan email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <label
                    htmlFor="gender"
                    className="block text-sm text-black mb-1.5"
                  >
                    Jenis Kelamin
                  </label>
                  <SelectField
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    placeholder="Pilih Jenis Kelamin"
                    options={[
                      { value: "laki-laki", label: "Laki-laki" },
                      { value: "perempuan", label: "Perempuan" },
                    ]}
                  />
                </div>
              </div>
            </section>

            <hr className="border-blue-200" />

            {/* Data Sekolah Section */}
            <section>
              <h2 className="text-base font-semibold text-[#012f72] mb-4">
                Data Sekolah
              </h2>

              <div className="space-y-4">
                {/* Kelas & Peminatan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="kelas"
                      className="block text-sm text-black mb-1.5"
                    >
                      Kelas
                    </label>
                    <SelectField
                      id="kelas"
                      name="kelas"
                      value={formData.kelas}
                      onChange={handleChange}
                      placeholder="Pilih Kelas"
                      options={[
                        { value: "10", label: "10" },
                        { value: "11", label: "11" },
                        { value: "12", label: "12" },
                      ]}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="peminatan"
                      className="block text-sm text-black mb-1.5"
                    >
                      Peminatan
                    </label>
                    <SelectField
                      id="peminatan"
                      name="peminatan"
                      value={formData.peminatan}
                      onChange={handleChange}
                      placeholder="Pilih Peminatan"
                      options={[
                        { value: "ipa", label: "IPA" },
                        { value: "ips", label: "IPS" },
                        { value: "bahasa", label: "Bahasa" },
                      ]}
                    />
                  </div>
                </div>

                {/* Asal Sekolah */}
                <div>
                  <label
                    htmlFor="school"
                    className="block text-sm text-black mb-1.5"
                  >
                    Asal Sekolah
                  </label>
                  <SelectField
                    id="school"
                    name="school"
                    value={formData.school}
                    onChange={handleChange}
                    placeholder="Pilih Asal Sekolah"
                    options={[
                      { value: "sman1-surabaya", label: "SMAN 1 Surabaya" },
                      { value: "sman3-surabaya", label: "SMAN 3 Surabaya" },
                      { value: "sman5-surabaya", label: "SMAN 5 Surabaya" },
                      { value: "other", label: "Lainnya" },
                    ]}
                  />
                </div>
              </div>
            </section>

            <hr className="border-blue-200" />

            {/* Buat Password Section */}
            <section>
              <h2 className="text-base font-semibold text-[#012f72] mb-4">
                Buat Password
              </h2>

              <div className="space-y-4">
                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm text-black mb-1.5"
                  >
                    Password <span className="text-red-500">*</span>
                  </label>
                  <PasswordField
                    id="password"
                    name="password"
                    placeholder="Masukkan min. 8 karakter"
                    value={formData.password}
                    onChange={handleChange}
                    show={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                    minLength={8}
                  />
                </div>

                {/* Konfirmasi Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm text-black mb-1.5"
                  >
                    Konfirmasi Password <span className="text-red-500">*</span>
                  </label>
                  <PasswordField
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Ulangi password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    show={showConfirmPassword}
                    onToggle={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    minLength={8}
                  />
                </div>

                {/* Terms & Conditions */}
                <div className="flex items-start gap-3">
                  <label className="relative inline-flex items-center cursor-pointer mt-0.5 flex-shrink-0">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-400 rounded-full peer peer-checked:bg-[#012f72] peer-focus:ring-2 peer-focus:ring-[#012f72]/50 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                  </label>
                  <label
                    htmlFor="terms"
                    className="text-sm text-black cursor-pointer leading-relaxed"
                  >
                    Saya setuju dengan{" "}
                    <Link
                      to="/terms"
                      className="text-[#012f72] font-medium hover:underline"
                    >
                      syarat dan ketentuan
                    </Link>{" "}
                    yang berlaku
                  </label>
                </div>
              </div>
            </section>

            {/* Submit Section */}
            <div className="space-y-4 pt-2">
              {/* Register Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#012f72] text-white text-base font-semibold rounded-full hover:bg-[#012559] focus:outline-none focus:ring-2 focus:ring-[#012f72] focus:ring-offset-2 transition-colors disabled:bg-[#012f72]/60 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
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
                  "Register Sekarang"
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <hr className="flex-1 border-neutral-300" />
                <span className="text-sm text-neutral-400">atau</span>
                <hr className="flex-1 border-neutral-300" />
              </div>

              {/* Google Register Button */}
              <button
                type="button"
                onClick={handleGoogleRegister}
                className="w-full h-12 bg-white border-2 border-[#012f72] text-[#012f72] text-base font-semibold rounded-full hover:bg-[#012f72]/5 focus:outline-none focus:ring-2 focus:ring-[#012f72] focus:ring-offset-2 transition-colors flex items-center justify-center gap-3"
              >
                <img
                  src={google}
                  alt=""
                  className="w-6 h-6"
                  aria-hidden="true"
                />
                <span>Register with Google</span>
              </button>
            </div>
          </form>

          {/* Login Link */}
          <p className="text-center text-base mt-6 pb-4">
            <span className="text-black">Sudah punya akun?</span>
            <Link
              to="/login"
              className="text-[#012f72] font-semibold hover:underline focus:underline focus:outline-none ml-1"
            >
              Login di sini
            </Link>
          </p>
        </div>

        {/* Right Section - Hero */}
        <aside className="hidden lg:flex flex-col bg-white p-8 sticky top-0 h-screen">
          {/* Logo & Title */}
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

          {/* Hero Image */}
          <div className="flex-1 rounded-2xl overflow-hidden">
            <img
              src={Register}
              alt="Ilustrasi pembelajaran online dengan siswa dan buku"
              className="w-full h-full object-cover"
            />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default RegisterPage;
