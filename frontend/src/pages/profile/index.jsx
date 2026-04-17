import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const Profile = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f0f5ff] flex items-center justify-center">
        <div className="text-xl text-[#012f72]">Loading...</div>
      </div>
    );
  }

  // Sample enrolled courses data - replace with actual data
  const enrolledCourses = [
    {
      id: 1,
      category: "Optimasi",
      title: "Program Linear",
      instructor: "Pak Nathan",
      duration: "30 Menit",
      gradient: "from-blue-100 to-purple-100",
    },
    {
      id: 2,
      category: "Kalkulus",
      title: "Integral Substitusi dan Parsial",
      instructor: "Pak Doni",
      duration: "20 Menit",
      gradient: "from-indigo-100 to-pink-100",
    },
    {
      id: 3,
      category: "Kalkulus",
      title: "Barisan dan Deret Tak Hingga",
      instructor: "Pak Satria",
      duration: "25 Menit",
      gradient: "from-purple-100 to-blue-100",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f0f5ff]">
     

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto mt-6 px-8 py-6">
        <div className="flex items-center gap-1 text-base font-semibold">
          <Link to="/" className="hover:text-[#012f72]">
            Beranda
          </Link>
          <span>/</span>
          <span className="text-[#f58610]">Profile</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 pb-20">
        {/* Hero Banner - Profile Info */}
        <div className="relative bg-gradient-to-r from-[#98c2ff] via-[#a894ed] to-[#df96ff] rounded-3xl p-12 mb-12 overflow-hidden">
          <div className="relative z-10 flex items-center gap-8">
            {/* Profile Picture */}
            <div className="relative">
              <img
                src={user.picture || "/default-avatar.png"}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <p className="text-lg font-semibold text-white mb-2">
                Selamat Datang
              </p>
              <h2 className="text-3xl font-extrabold text-white mb-2">
                {user.name}
              </h2>
              <p className="text-white text-opacity-90">{user.email}</p>
            </div>

            {/* Edit Profile Button */}
            <Link
              to="/profile/edit"
              className="px-6 py-3 bg-white text-[#012f72] font-semibold rounded-lg hover:bg-opacity-90 transition-all shadow-md"
            >
              Edit Profile
            </Link>
          </div>

          {/* Decorative Circle */}
          <div className="absolute right-12 top-1/2 -translate-y-1/2 w-72 h-72 bg-white bg-opacity-10 rounded-full"></div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-4xl font-bold text-[#012f72]">
              {enrolledCourses.length}
            </h3>
            <p className="text-[#525252] mt-2">Kursus Terdaftar</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-4xl font-bold text-[#012f72]">12</h3>
            <p className="text-[#525252] mt-2">Kursus Selesai</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md">
            <h3 className="text-4xl font-bold text-[#012f72]">85%</h3>
            <p className="text-[#525252] mt-2">Progress Belajar</p>
          </div>
        </div>

        {/* Enrolled Courses Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#012f72] mb-6">
            Kursus yang Diikuti
          </h2>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {enrolledCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div
                className={`h-48 bg-gradient-to-br ${course.gradient} rounded-t-lg`}
              ></div>
              <div className="p-7 space-y-4">
                <span className="inline-block bg-[#97bfff] bg-opacity-35 text-[#012f72] text-sm px-4 py-1 rounded">
                  {course.category}
                </span>
                <h3 className="text-base font-semibold text-[#012f72]">
                  {course.title}
                </h3>
                <div className="flex items-center gap-5 text-xs text-[#525252]">
                  <span>{course.instructor}</span>
                  <span>{course.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State if no courses */}
        {enrolledCourses.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-md">
            <p className="text-[#525252] text-lg mb-4">
              Belum ada kursus yang diikuti
            </p>
            <Link
              to="/courses"
              className="inline-block px-6 py-3 bg-[#012f72] text-white font-semibold rounded-lg hover:bg-opacity-90 transition-all"
            >
              Jelajahi Kursus
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default Profile;
