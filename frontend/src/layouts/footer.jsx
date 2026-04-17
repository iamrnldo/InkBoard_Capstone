// Placeholder images - replace with your actual imports
import logo2 from "@/assets/logo/logo2.png";
import Whatsapp from "@/assets/element/whatsapp.svg";
import Linkedin from "@/assets/element/linkedin.svg";
import Instagram from "@/assets/element/instagram.svg";
import Tiktok from "@/assets/element/tiktok.svg";

const Footer = () => {
  return (
    <footer className="bg-sky-900 text-white py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-16 mb-8 md:mb-12">
          {/* Logo Section */}
          <div className="flex flex-col items-center lg:items-start w-full lg:w-auto">
            <img
              className="h-16 md:h-20 w-auto mb-3 md:mb-4"
              src={logo2}
              alt="Logo"
            />
            <h3 className="text-2xl md:text-3xl font-bold">EduSukses</h3>
            <p className="mt-2 md:mt-4 opacity-90 text-sm md:text-base text-center lg:text-left">
              Belajar Fleksibel, Prestasi Maksimal
            </p>
          </div>

          {/* Vertical Line - only visible on large screens */}
          <div className="hidden lg:block w-px bg-white/20 self-stretch min-h-[12rem]"></div>

          {/* Links & Social */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 flex-1 w-full text-center lg:text-left">
            <div className="space-y-4">
              <h4 className="text-base md:text-lg font-semibold mb-4 md:mb-6">
                Pengguna
              </h4>
              <ul className="space-y-2 md:space-y-3 opacity-80 text-sm md:text-base">
                <li>
                  <a
                    href="#beranda"
                    className="hover:underline hover:opacity-100 transition-opacity duration-200"
                  >
                    Beranda
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:underline hover:opacity-100 transition-opacity duration-200"
                  >
                    Kelas
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:underline hover:opacity-100 transition-opacity duration-200"
                  >
                    Try Out
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-base md:text-lg font-semibold mb-4 md:mb-6">
                Tentang Kami
              </h4>
              <ul className="space-y-2 md:space-y-3 opacity-80 text-sm md:text-base">
                <li>
                  <a
                    href="#"
                    className="hover:underline hover:opacity-100 transition-opacity duration-200"
                  >
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:underline hover:opacity-100 transition-opacity duration-200"
                  >
                    Hubungi Kami
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-4 sm:col-span-2 md:col-span-1">
              <h4 className="text-base md:text-lg font-semibold mb-4 md:mb-6">
                Media Sosial
              </h4>
              <div className="flex gap-2 md:gap-3 lg:gap-4 justify-center lg:justify-start">
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200"
                  aria-label="WhatsApp 1"
                >
                  <img
                    src={Whatsapp}
                    alt="WhatsApp"
                    className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12"
                  />
                </a>
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200"
                  aria-label="WhatsApp 2"
                >
                  <img
                    src={Linkedin}
                    alt="LinkedIn"
                    className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12"
                  />
                </a>
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200"
                  aria-label="WhatsApp 3"
                >
                  <img
                    src={Instagram}
                    alt="Instagram"
                    className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12"
                  />
                </a>
                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-200"
                  aria-label="WhatsApp 4"
                >
                  <img
                    src={Tiktok}
                    alt="Tiktok"
                    className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 md:pt-8 text-center text-xs md:text-sm opacity-70">
          <p>© {new Date().getFullYear()} EduSukses. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
