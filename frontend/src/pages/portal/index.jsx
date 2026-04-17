import { Link } from "react-router-dom"; // Added import
// import element1 from "@/assets/element/element1.png";
import hero1 from "@/assets/hero/hero1.png";
import element1 from "@/assets/element/element1.png";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext"; // Added import

const PortalPage = () => {
  // Mock user for demonstration - replace with your actual AuthContext
const { user, logout } = useContext(AuthContext);

  return (
    <>
      {/* User Display */}
      {user && (
        <div className="text-center mb-8">
          <h2>Welcome, {user.name}!</h2>
          <img
            src={user.picture}
            alt="Profile"
            className="w-20 h-20 rounded-full mx-auto"
          />
          <button
            onClick={logout}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded"
          >
            Logout
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section
        id="beranda"
        className="relative overflow-hidden w-full h-[1080px] flex items-center"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-300 via-violet-400 to-fuchsia-300">
          <div className="absolute w-80 h-80 bg-white/20 rounded-full -left-20 top-40"></div>
          <div className="absolute w-80 h-80 bg-white/20 rounded-full right-20 top-20"></div>
          <div className="absolute w-80 h-80 bg-white/20 rounded-full right-0 -top-40"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-8 pb-60">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-sky-100 px-6 py-2 rounded-full">
                <svg
                  className="w-5 h-5 text-sky-900"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
                </svg>
                <span className="text-sky-900 text-sm font-medium">
                  Platform Edukasi #1 untuk Siswa SMA
                </span>
              </div>

              <h1 className="text-5xl font-medium leading-tight">
                <span className="text-zinc-800">Raih Prestasi</span>
                <span className="text-lime-50 font-bold"> Terbaikmu!!</span>
              </h1>

              <p className="text-zinc-800 text-lg">
                Belajar dengan metode interaktif, tutor berpengalaman, dan
                materi lengkap untuk semua mata pelajaran SMA. Mulai perjalanan
                suksesmu sekarang!
              </p>

              <div className="bg-white rounded-2xl p-8 shadow-lg inline-flex flex-wrap gap-6">
                <div className="text-center">
                  <div className="text-sky-900 text-3xl font-bold">15K+</div>
                  <div className="text-zinc-600">Siswa Aktif</div>
                </div>
                <div className="w-px bg-neutral-400"></div>
                <div className="text-center">
                  <div className="text-sky-900 text-3xl font-bold">500+</div>
                  <div className="text-zinc-600">Video Pembelajaran</div>
                </div>
                <div className="w-px bg-neutral-400"></div>
                <div className="text-center">
                  <div className="text-sky-900 text-3xl font-bold flex items-center gap-2">
                    4.9 <span className="text-yellow-400">★</span>
                  </div>
                  <div className="text-zinc-600">Rating Pengguna</div>
                </div>
              </div>

              <Link
                to="/login"
                className="bg-sky-900 text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:bg-sky-800 transition flex items-center gap-2 w-fit"
              >
                Mulai Belajar Gratis
                <span className="text-xl">→</span>
              </Link>
            </div>

            <div className="relative mx-auto max-w-md">
              <img
                src={hero1}
                alt="Student"
                className="rounded-[250px] w-full max-w-md mx-auto shadow-2xl"
              />
              <div className="absolute -top-8 -right-8 bg-yellow-300 rounded-2xl px-16 py-6 transform rotate-[-11deg] shadow-lg">
                <img
                  className=" w-auto h-12  transform rotate-[11deg]"
                  src={element1}
                  alt="Element1"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <div className="bg-blue-50">
        <section className="-mt-80 pb-20 relative   ">
          <div className="max-w-5xl mx-auto px-8 ">
            <div className="bg-white rounded-3xl shadow-2xl p-16 ">
              <div className="mb-12">
                <h2 className="text-sky-900 text-3xl font-semibold mb-2">
                  Materi Pembelajaran
                </h2>
                <p className="text-sky-900 text-lg">
                  Pilih mata pelajaran yang ingin kamu kuasai
                </p>
              </div>

              <div className="space-y-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="bg-white border border-neutral-400 rounded-lg p-4 text-center hover:shadow-lg transition cursor-pointer">
                    <img
                      src="https://placehold.co/50x50"
                      alt="Math"
                      className="w-12 h-12 rounded-full mx-auto mb-3"
                    />
                    <div className="text-black font-medium">
                      Matematika Peminatan
                    </div>
                  </div>
                  <div className="bg-white border border-neutral-400 rounded-lg p-4 text-center hover:shadow-lg transition cursor-pointer">
                    <img
                      src="https://placehold.co/50x50"
                      alt="Math"
                      className="w-12 h-12 rounded-full mx-auto mb-3"
                    />
                    <div className="text-black font-medium">
                      Matematika Wajib
                    </div>
                  </div>
                  <div className="bg-white border border-neutral-400 rounded-lg p-4 text-center hover:shadow-lg transition cursor-pointer">
                    <img
                      src="https://placehold.co/50x50"
                      alt="English"
                      className="w-12 h-12 rounded-full mx-auto mb-3"
                    />
                    <div className="text-black font-medium">Bahasa Inggris</div>
                  </div>
                  <div className="bg-white border border-neutral-400 rounded-lg p-4 text-center hover:shadow-lg transition cursor-pointer">
                    <img
                      src="https://placehold.co/50x50"
                      alt="Indonesian"
                      className="w-12 h-12 rounded-full mx-auto mb-3"
                    />
                    <div className="text-black font-medium">
                      Bahasa Indonesia
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="bg-white border border-neutral-400 rounded-lg p-4 text-center hover:shadow-lg transition cursor-pointer">
                    <img
                      src="https://placehold.co/50x50"
                      alt="Physics"
                      className="w-12 h-12 rounded-full mx-auto mb-3"
                    />
                    <div className="text-black font-medium">Fisika</div>
                  </div>
                  <div className="bg-white border border-neutral-400 rounded-lg p-4 text-center hover:shadow-lg transition cursor-pointer">
                    <img
                      src="https://placehold.co/50x50"
                      alt="Chemistry"
                      className="w-12 h-12 rounded-full mx-auto mb-3"
                    />
                    <div className="text-black font-medium">Kimia</div>
                  </div>
                  <div className="bg-white border border-neutral-400 rounded-lg p-4 text-center hover:shadow-lg transition cursor-pointer">
                    <img
                      src="https://placehold.co/50x50"
                      alt="Biology"
                      className="w-12 h-12 rounded-full mx-auto mb-3"
                    />
                    <div className="text-black font-medium">Biologi</div>
                  </div>
                  <div className="bg-white border border-neutral-400 rounded-lg p-4 text-center hover:shadow-lg transition cursor-pointer">
                    <img
                      src="https://placehold.co/50x50"
                      alt="Civics"
                      className="w-12 h-12 rounded-full mx-auto mb-3"
                    />
                    <div className="text-black font-medium">PPKn</div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="text-sky-900 font-medium flex items-center gap-2 hover:opacity-80 transition">
                    Lihat Semua Pelajaran
                    <span className="text-xl">↓</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Features Section */}
      <section id="fitur" className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-black text-3xl font-semibold mb-2">
              Mengapa Memilih Belajar di EduSukses?
            </h2>
            <p className="text-black text-lg">
              Fitur unggulan yang membantu kesuksesan belajarmu
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-12 text-center space-y-6 hover:shadow-xl transition">
              <div className="bg-sky-900 rounded-3xl p-6 inline-block">
                <svg
                  className="w-16 h-16 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-zinc-800 text-xl font-semibold">
                Metode Pembelajaran Interaktif
              </h3>
              <p className="text-black">
                EduSukses menyediakan video materi, diskusi real-time, dan modul
                yang dipersonalisasi agar belajar lebih menarik dan sesuai
                kebutuhan siswa SMA.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-12 text-center space-y-6 hover:shadow-xl transition">
              <div className="bg-sky-900 rounded-3xl p-6 inline-block">
                <svg
                  className="w-16 h-16 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <h3 className="text-zinc-800 text-xl font-semibold">
                Guru Profesional dan Kompeten
              </h3>
              <p className="text-black">
                Pengajar berpengalaman siap menghadirkan pembelajaran yang
                nyaman dengan materi berkualitas untuk mendukung persiapan
                kuliah dan kariermu.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-12 text-center space-y-6 hover:shadow-xl transition">
              <div className="bg-sky-900 rounded-3xl p-6 inline-block">
                <svg
                  className="w-16 h-16 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-zinc-800 text-xl font-semibold">
                Belajar Nyaman dan Fleksibel
              </h3>
              <p className="text-black">
                Siswa SMA dapat mengakses materi kapan saja dengan jadwal yang
                fleksibel, sehingga belajar tidak terbatas oleh waktu maupun
                tempat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="tentang" className="py-20  bg-blue-50">
        <div className="max-w-6xl mx-auto px-8">
          <div className="bg-white rounded-3xl p-16 shadow-lg">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
              <div className="space-y-8">
                <div>
                  <h2 className="text-black text-3xl font-semibold mb-2">
                    Tentang EduSukses
                  </h2>
                  <p className="text-black">
                    Platform Edukasi Terpercaya untuk Siswa SMA
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-orange-500 rounded"></div>
                    <h4 className="text-sky-900 text-lg font-semibold">
                      Misi Kami
                    </h4>
                    <p className="text-black">
                      Membuat pendidikan berkualitas dapat diakses oleh semua
                      siswa
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-orange-500 rounded"></div>
                    <h4 className="text-sky-900 text-lg font-semibold">
                      Pengalaman
                    </h4>
                    <p className="text-black">
                      5+ tahun pengalaman dalam pendidikan online
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-orange-500 rounded"></div>
                    <h4 className="text-sky-900 text-lg font-semibold">
                      Komunitas
                    </h4>
                    <p className="text-black">
                      50,000+ siswa aktif dari seluruh Indonesia
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 bg-orange-500 rounded"></div>
                    <h4 className="text-sky-900 text-lg font-semibold">
                      Hasil Terbukti
                    </h4>
                    <p className="text-black">
                      98% siswa berhasil meningkatkan nilai mereka
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <img
                  src="https://placehold.co/290x278"
                  alt="About"
                  className="w-full rounded-3xl shadow-lg"
                />
              </div>
            </div>

            {/* Testimonials */}
            <div className="space-y-12">
              <div className="text-center">
                <h2 className="text-black text-3xl font-semibold mb-2">
                  Kata Mereka Tentang EduSukses
                </h2>
                <p className="text-black text-lg">
                  Testimoni dari siswa yang sudah merasakan manfaatnya
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                <div className="bg-white border-2 border-sky-900 rounded-3xl p-8 space-y-6 shadow-lg">
                  <div className="flex items-center gap-4">
                    <img
                      src="https://placehold.co/70x70"
                      alt="Rani"
                      className="w-16 h-16 rounded-full"
                    />
                    <div>
                      <div className="text-sky-900 font-semibold">Rani</div>
                      <div className="text-orange-500 text-sm font-semibold">
                        Kelas 12
                      </div>
                    </div>
                  </div>
                  <p className="text-black text-sm">
                    "Belajar di EduSukses membuat saya lebih mudah memahami
                    materi. Sekarang saya lebih siap menghadapi ujian dan
                    seleksi masuk kuliah."
                  </p>
                </div>

                <div className="bg-white border-2 border-sky-900 rounded-3xl p-8 space-y-6 shadow-lg">
                  <div className="flex items-center gap-4">
                    <img
                      src="https://placehold.co/70x70"
                      alt="Sehan"
                      className="w-16 h-16 rounded-full"
                    />
                    <div>
                      <div className="text-sky-900 font-semibold">Sehan</div>
                      <div className="text-orange-500 text-sm font-semibold">
                        Kelas 12
                      </div>
                    </div>
                  </div>
                  <p className="text-black text-sm">
                    "Saya menggunakan EduSukses untuk persiapan masuk perguruan
                    tinggi. Modulnya membantu saya menemukan jurusan yang
                    sesuai, dan kini saya bisa kuliah di kampus impian."
                  </p>
                </div>

                <div className="bg-white border-2 border-sky-900 rounded-3xl p-8 space-y-6 shadow-lg">
                  <div className="flex items-center gap-4">
                    <img
                      src="https://placehold.co/70x70"
                      alt="Alicia"
                      className="w-16 h-16 rounded-full"
                    />
                    <div>
                      <div className="text-sky-900 font-semibold">Alicia</div>
                      <div className="text-orange-500 text-sm font-semibold">
                        Kelas 11
                      </div>
                    </div>
                  </div>
                  <p className="text-black text-sm">
                    "Belajar di EduSukses membuat saya lebih mudah memahami
                    materi. Sekarang saya lebih siap menghadapi ujian dan
                    seleksi masuk kuliah."
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="mt-20 grid md:grid-cols-2 gap-12 items-center">
              <div>
                <img
                  src="https://placehold.co/447x410"
                  alt="FAQ"
                  className="w-full rounded-3xl shadow-lg"
                />
              </div>

              <div className="space-y-6">
                <h2 className="text-black text-3xl font-semibold">
                  Pertanyaan Umum (FAQ)
                </h2>

                <div className="space-y-4">
                  <div className="border-t border-b border-blue-300 py-4 cursor-pointer hover:bg-blue-50 transition">
                    <div className="flex justify-between items-center">
                      <span className="text-black font-medium">
                        Apa tujuan aplikasi ini?
                      </span>
                      <span className="text-2xl">+</span>
                    </div>
                  </div>
                  <div className="border-t border-b border-blue-300 py-4 cursor-pointer hover:bg-blue-50 transition">
                    <div className="flex justify-between items-center">
                      <span className="text-black font-medium">
                        Bagaimana cara belajar di EduSukses?
                      </span>
                      <span className="text-2xl">+</span>
                    </div>
                  </div>
                  <div className="border-t border-b border-blue-300 py-4 cursor-pointer hover:bg-blue-50 transition">
                    <div className="flex justify-between items-center">
                      <span className="text-black font-medium">
                        Apakah EduSukses membantu persiapan kuliah?
                      </span>
                      <span className="text-2xl">+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default PortalPage;