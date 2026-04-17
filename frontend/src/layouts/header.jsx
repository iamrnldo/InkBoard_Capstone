import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom"; // Added import
import logo1 from "@/assets/logo/logo1.png";
import jet from "@/assets/element/jet.png";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const loggedOutMenu = [
  { name: "Beranda", hash: "#beranda" },
  { name: "Fitur", hash: "#fitur" },
  { name: "Tentang", hash: "#tentang" },
];

const loggedInMenu = [
  { name: "Beranda", hash: "/dashboard" },
  { name: "Kelas", hash: "#kelas" },
  { name: "Try Out", hash: "#tryout" },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Added for dropdown
  const [activeLink, setActiveLink] = useState("");
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null); // Added for dropdown ref
  const { user, logout } = useContext(AuthContext);

  const menuItems = user ? loggedInMenu : loggedOutMenu;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  // Active link berdasarkan hash + default Beranda
  useEffect(() => {
    const updateActive = () => {
      setActiveLink(window.location.hash || "#beranda");
    };
    updateActive();
    window.addEventListener("hashchange", updateActive);
    return () => window.removeEventListener("hashchange", updateActive);
  }, []);

  // Click outside untuk close mobile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
      // Close dropdown if click outside
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isMenuOpen, isDropdownOpen]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
    }
  };

  const linkClasses = (hash) =>
    `text-lg font-bold transition-colors duration-300 ease-out ${
      activeLink === hash
        ? "bg-gradient-to-r from-blue-700 to-purple-500 bg-clip-text text-transparent"
        : "text-slate-900 hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-500 hover:bg-clip-text hover:text-transparent"
    }`;

  return (
    <nav className="w-full bg-white/0 backdrop-blur-lg shadow-md fixed top-0 z-50 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center">
            <a href="#beranda">
              <img className="h-10 w-auto" src={logo1} alt="Logo" />
            </a>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.hash}
                className={linkClasses(item.hash)}
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Get Started / Profile Dropdown + Hamburger */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <img
                    src={user.picture}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sky-900 font-medium">{user.name}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-8 w-48 bg-white/30 backdrop-blur-2xl rounded-xl shadow-2xl py-2 z-10 border border-white/40">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-800 hover:bg-white/40 transition-all duration-200 rounded-lg mx-1"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-800 hover:bg-white/40 transition-all duration-200 rounded-lg mx-1"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-gradient-to-r from-blue-700 to-purple-500 rounded-2xl flex items-center gap-2 hover:opacity-90 transition-all duration-300 ease-out text-sm md:text-base md:px-5 md:py-2.5 md:gap-4 hover:scale-105 active:scale-95"
              >
                <span className="text-white font-medium md:text-xl">
                  Get Started
                </span>
                <img
                  className="w-4 h-4 md:w-5 md:h-5"
                  src={jet}
                  alt="Jet Icon"
                />
              </Link>
            )}

            <button
              ref={buttonRef}
              className="md:hidden text-sky-900 w-6 h-6 flex flex-col justify-center items-center focus:outline-none"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <div className="w-6 h-5 relative flex flex-col justify-between">
                <span
                  className={`block h-0.5 w-full bg-sky-900 transition-all duration-500 ease-[cubic-bezier(0.4,0.0,0.2,1)] ${
                    isMenuOpen ? "rotate-45 translate-y-2" : ""
                  }`}
                ></span>
                <span
                  className={`block h-0.5 w-full bg-sky-900 transition-all duration-500 ease-[cubic-bezier(0.4,0.0,0.2,1)] ${
                    isMenuOpen ? "opacity-0" : ""
                  }`}
                ></span>
                <span
                  className={`block h-0.5 w-full bg-sky-900 transition-all duration-500 ease-[cubic-bezier(0.4,0.0,0.2,1)] ${
                    isMenuOpen ? "-rotate-45 -translate-y-2" : ""
                  }`}
                ></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          ref={menuRef}
          className={`md:hidden overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0.0,0.2,1)] ${
            isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col items-center gap-4 py-4 bg-white/0 backdrop-blur-lg shadow-lg border-t border-white/20">
            {menuItems.map((item, index) => (
              <a
                key={item.name}
                href={item.hash}
                onClick={toggleMenu}
                className={`${linkClasses(
                  item.hash
                )} transform transition-all duration-500 ease-[cubic-bezier(0.4,0.0,0.2,1)] ${
                  isMenuOpen
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-4 opacity-0"
                }`}
                style={{
                  transitionDelay: isMenuOpen ? `${index * 50}ms` : "0ms",
                }}
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
