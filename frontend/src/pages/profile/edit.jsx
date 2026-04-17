import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";

const EditProfile = () => {
  const { user, setUser } = useContext(AuthContext);

  const [name, setName] = useState(user?.name || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(user?.picture || "");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleNameChange = (e) => {
    setName(e.target.value);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      // Update name
      const res = await axios.put("http://localhost:5000/api/profile", {
        name,
      });
      setUser(res.data);
      setSuccess("Profile updated successfully!");
    } catch (err) {
      setError("Failed to update profile. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPicture = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("picture", selectedFile);

    try {
      setError(null);
      setSuccess(null);
      setLoading(true);

      const res = await axios.post(
        "http://localhost:5000/api/profile/upload-picture",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setUser({ ...user, picture: res.data.picture });
      setPreview(res.data.picture);
      setSelectedFile(null);
      setSuccess("Picture updated successfully!");
    } catch (err) {
      setError("Failed to update picture. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f0f5ff] flex items-center justify-center">
        <div className="text-xl text-[#012f72]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f5ff]">
    

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto mt-6 px-8 py-6">
        <div className="flex items-center gap-1 text-base font-semibold">
          <Link to="/" className="hover:text-[#012f72]">
            Beranda
          </Link>
          <span>/</span>
          <Link to="/profile" className="hover:text-[#012f72]">
            Profile
          </Link>
          <span>/</span>
          <span className="text-[#f58610]">Edit Profile</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 pb-20">
        {/* Hero Banner */}
        <div className="relative bg-gradient-to-r from-[#98c2ff] via-[#a894ed] to-[#df96ff] rounded-3xl p-12 mb-12 overflow-hidden">
          <div className="relative z-10">
            <p className="text-lg font-semibold text-white mb-2">Pengaturan</p>
            <h2 className="text-2xl font-extrabold text-white">EDIT PROFILE</h2>
          </div>
          <div className="absolute right-12 top-1/2 -translate-y-1/2 w-72 h-72 bg-white bg-opacity-10 rounded-full"></div>
        </div>

        {/* Edit Form Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-8">
            {/* Success/Error Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-600">{success}</p>
              </div>
            )}

            {/* Profile Picture Section */}
            <div className="flex flex-col items-center mb-8 pb-8 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-[#012f72] mb-4">
                Foto Profile
              </h3>
              <div className="relative mb-4">
                <img
                  src={preview || "/default-avatar.png"}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#97bfff]"
                />
                <label
                  htmlFor="file-upload"
                  className="absolute bottom-0 right-0 w-10 h-10 bg-[#012f72] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#023e94] transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {selectedFile && (
                <button
                  onClick={handleUploadPicture}
                  disabled={loading}
                  className="px-6 py-2 bg-[#012f72] text-white rounded-lg hover:bg-[#023e94] transition-colors disabled:opacity-50"
                >
                  {loading ? "Uploading..." : "Upload Foto"}
                </button>
              )}
            </div>

            {/* Name Section */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#012f72] mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#97bfff] focus:border-transparent"
                placeholder="Masukkan nama lengkap"
              />
            </div>

            {/* Email Section (Read-only) */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-[#012f72] mb-2">
                Email
              </label>
              <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-600">
                {user.email}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Email tidak dapat diubah
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleUpdateProfile}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-[#012f72] text-white font-semibold rounded-lg hover:bg-[#023e94] transition-colors disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
              <Link
                to="/profile"
                className="px-6 py-3 border border-[#012f72] text-[#012f72] font-semibold rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Batal
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditProfile;
