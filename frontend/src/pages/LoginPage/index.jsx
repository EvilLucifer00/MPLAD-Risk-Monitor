import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { TbEye, TbEyeOff, TbLogin, TbChevronDown } from "react-icons/tb";
import { IoShieldCheckmark } from "react-icons/io5";
import { authApi } from "../../api/auth";
import { useAuthStore } from "../../store/useAuthStore";
import IndianMonumentsSkyline from "../../components/shared/IndianMonumentsSkyline";
import EmblemImage from "../../components/shared/EmblemImage";

const ROLES = [
  { value: "mp", label: "Member of Parliament (MP)", portal: "Member of Parliament Portal (/mp)", ready: true },
  { value: "district_authority", label: "District Authority (DA / DM)", portal: "District Authority Portal (/da)", ready: true },
  { value: "state_authority", label: "State Nodal Authority", portal: "State Nodal Authority Portal", ready: false },
  { value: "pwd_cpwd", label: "PWD / CPWD Implementing Agency", portal: "PWD / CPWD Agency Portal", ready: false },
  { value: "minister_mospi", label: "MoSPI Ministry Administration", portal: "MoSPI Central Ministry Portal", ready: false },
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { token, role, setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", role: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleDropdownRef = useRef(null);

  // Close custom role dropdown on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
        setRoleDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setRoleDropdownOpen(false);
    };

    if (roleDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [roleDropdownOpen]);

  useEffect(() => {
    if (token && role) {
      if (role === "MP") {
        navigate("/mp", { replace: true });
      } else if (role === "DM") {
        navigate("/da", { replace: true });
      }
    }
  }, [token, role, navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.role || !form.password) {
      setError("Please fill in all fields including your role.");
      return;
    }

    let backendRole = "";
    if (form.role === "mp") {
      backendRole = "MP";
    } else if (form.role === "district_authority") {
      backendRole = "DM";
    } else {
      setError(`Dashboard for ${form.role.replace('_', ' ')} is under construction.`);
      return;
    }

    const rawUsername = form.username.trim();
    const normalizedUsername =
      rawUsername.toLowerCase().startsWith('mp-') || rawUsername.toLowerCase().startsWith('dm-')
        ? rawUsername.toUpperCase()
        : rawUsername;

    setLoading(true);
    setError("");

    try {
      const loginRes = await authApi.login({
        username: normalizedUsername,
        password: form.password,
        role: backendRole,
      });

      const accessToken = loginRes.access_token;

      // Fetch user profile from the respective /me endpoint
      let profile = null;
      if (backendRole === "MP") {
        profile = await authApi.getMpProfile(accessToken);
      } else if (backendRole === "DM") {
        profile = await authApi.getDmProfile(accessToken);
      }

      // Persist auth token, role, and profile
      setAuth(accessToken, backendRole, profile);

      // Route to the corresponding dashboard
      if (backendRole === "MP") {
        navigate("/mp");
      } else {
        navigate("/da");
      }
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col w-full bg-slate-50 relative overflow-x-hidden">
      {/* ── Background Decorations (same as HomePage) ── */}

      {/* Top Right Ashoka Chakra */}
      <svg
        className="absolute top-[-8%] right-[-2%] w-[45%] max-w-[600px] aspect-square pointer-events-none z-0 opacity-[0.04]"
        viewBox="0 0 100 100"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#123b63"
          strokeWidth="2"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#123b63"
          strokeWidth="0.5"
        />
        {Array.from({ length: 24 }).map((_, i) => (
          <line
            key={i}
            x1="50"
            y1="50"
            x2="50"
            y2="8"
            stroke="#123b63"
            strokeWidth="1"
            transform={`rotate(${i * 15} 50 50)`}
          />
        ))}
        <circle cx="50" cy="50" r="5" fill="#123b63" />
      </svg>

      {/* Top Right Tricolor Swoosh */}
      <svg
        className="absolute top-0 right-0 w-[38%] h-[50%] pointer-events-none z-0"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d="M 0 0 C 40 30, 70 70, 100 100 L 100 0 Z"
          fill="#138808"
          opacity="0.12"
        />
        <path
          d="M 20 0 C 50 30, 80 60, 100 80 L 100 0 Z"
          fill="#ffffff"
          opacity="0.5"
        />
        <path
          d="M 40 0 C 60 25, 85 45, 100 60 L 100 0 Z"
          fill="#FF9933"
          opacity="0.15"
        />
      </svg>

      {/* Bottom Left Tricolor Swoosh */}
      <svg
        className="absolute bottom-0 left-0 w-[30%] h-[35%] pointer-events-none z-0"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d="M 0 0 C 30 50, 60 80, 100 100 L 0 100 Z"
          fill="#FF9933"
          opacity="0.12"
        />
        <path
          d="M 0 25 C 25 55, 50 85, 80 100 L 0 100 Z"
          fill="#ffffff"
          opacity="0.5"
        />
        <path
          d="M 0 50 C 15 65, 40 90, 60 100 L 0 100 Z"
          fill="#138808"
          opacity="0.12"
        />
      </svg>

      {/* Bottom Right Skyline & Tagline */}
      <div className="absolute bottom-4 right-2 sm:right-6 lg:right-12 flex flex-col items-end gap-1.5 lg:gap-2 z-0 pointer-events-none max-w-[95vw]">
        <IndianMonumentsSkyline
          variant="light"
          idPrefix="loginSkyline"
          className="w-[280px] sm:w-[350px] lg:w-[450px] h-auto lg:h-[55px] opacity-80 hover:opacity-100 transition-opacity duration-300"
        />
        <div className="flex items-center gap-1.5 lg:gap-3 w-full justify-end">
          <div className="flex gap-0.5 shrink-0">
            <div className="w-2.5 lg:w-4 h-0.5 bg-[#FF9933]"></div>
            <div className="w-2.5 lg:w-4 h-0.5 bg-[#ffffff]"></div>
            <div className="w-2.5 lg:w-4 h-0.5 bg-[#138808]"></div>
          </div>
          <p className="text-[6.5px] sm:text-[7.5px] lg:text-[9px] font-bold tracking-[0.1em] lg:tracking-[0.2em] text-slate-600 uppercase whitespace-nowrap">
            Sabka Saath | Sabka Vikas | Mazboot Bharat
          </p>
          <div className="flex gap-0.5 shrink-0">
            <div className="w-2.5 lg:w-4 h-0.5 bg-[#FF9933]"></div>
            <div className="w-2.5 lg:w-4 h-0.5 bg-[#ffffff]"></div>
            <div className="w-2.5 lg:w-4 h-0.5 bg-[#138808]"></div>
          </div>
        </div>
      </div>

      {/* ── Official Header Navbar (Fixed at top) ── */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-12 py-2.5 min-h-14 bg-white/95 backdrop-blur-md border-b border-slate-300 shadow-xs">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123b63] rounded cursor-pointer"
            aria-label="MPLADS Risk Monitor Home"
          >
            <EmblemImage
              width="36"
              height="40"
              className="w-9 h-10 object-contain shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base md:text-lg font-bold tracking-tight text-[#123b63] leading-tight block group-hover:text-[#0c2a47] transition-colors">
                  MPLADS Risk Monitor
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-slate-100 text-[#123b63] rounded border border-slate-300">
                  GOI
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-600 tracking-tight leading-none mt-0.5">
                Ministry of Statistics & Programme Implementation
              </p>
            </div>
          </button>

          {/* Right Action: Public Portal return button */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="items-center px-2 py-0.5 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded">
              Security Level: Restricted
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Content (Offset for fixed navbar) ── */}
      <main id="main-content" className="flex flex-1 items-center justify-center px-4 pt-20 pb-8 sm:pt-24 sm:pb-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="relative overflow-hidden rounded-xl shadow-lg bg-white border border-slate-300">
            {/* Card top banner — institutional styling matching hero */}
            <div
              className="relative px-6 sm:px-8 pt-6 pb-5 bg-cover bg-center bg-mplad-headquarters border-b border-slate-200"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0b243d]/95 via-[#123b63]/85 to-black/35" />
              <div className="relative z-10 flex flex-col items-center gap-2.5">
                <div className="flex items-center gap-2.5 pb-2 border-b border-white/15 w-full justify-center">
                  <EmblemImage
                    width="28"
                    height="34"
                    alt="Government of India"
                    className="w-7 h-8.5 object-contain drop-shadow-sm"
                  />
                  <div className="text-white leading-tight text-left">
                    <p className="text-[10px] uppercase tracking-widest text-slate-200 font-bold">
                      Government of India
                    </p>
                    <p className="font-semibold text-[11px] text-white tracking-tight mt-0.5">
                      Ministry of Statistics and Programme Implementation
                    </p>
                  </div>
                </div>

                <div className="text-center mt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block mb-0.5">
                    Official Portal Authentication
                  </span>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
                    <IoShieldCheckmark size={20} className="text-cyan-400 shrink-0" aria-hidden="true" />
                    <span>Administrative Sign In</span>
                  </h1>
                  <p className="text-slate-200/90 text-xs mt-1 leading-relaxed max-w-sm">
                    Access restricted to Members of Parliament, District Authorities, and authorized MoSPI personnel.
                  </p>
                </div>
              </div>
            </div>

            {/* Form body */}
            <div className="px-6 py-5">
              {/* Quick-fill Evaluation Accounts */}
              <div className="mb-4 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Evaluation Demo Accounts
                  </span>
                  <span className="text-[9px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    One-Click Fill
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ username: "MP-01", password: "12345678", role: "mp" });
                      setError("");
                    }}
                    className="p-2 rounded text-left bg-white hover:bg-slate-100 border border-slate-300 text-xs transition-colors cursor-pointer group"
                  >
                    <div className="font-bold text-[#123b63] group-hover:text-[#0c2a47] flex items-center justify-between">
                      <span>MP Portal</span>
                      <span className="text-[9px] font-mono text-slate-500 font-normal">MP-01</span>
                    </div>
                    <div className="text-[10.5px] text-slate-500 truncate mt-0.5">Kanthi Constituency</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ username: "DM-01", password: "12345678", role: "district_authority" });
                      setError("");
                    }}
                    className="p-2 rounded text-left bg-white hover:bg-slate-100 border border-slate-300 text-xs transition-colors cursor-pointer group"
                  >
                    <div className="font-bold text-[#123b63] group-hover:text-[#0c2a47] flex items-center justify-between">
                      <span>DA / DM Portal</span>
                      <span className="text-[9px] font-mono text-slate-500 font-normal">DM-01</span>
                    </div>
                    <div className="text-[10.5px] text-slate-500 truncate mt-0.5">East Medinipur Dist</div>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                {/* Username */}
                <div className="mb-3.5">
                  <label
                    htmlFor="login-username"
                    className="block text-xs font-bold uppercase tracking-wider text-[#123b63] mb-1"
                  >
                    Username / Official Email
                  </label>
                  <input
                    id="login-username"
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Enter your username or email"
                    className="w-full px-3 py-2 rounded border border-slate-300 bg-white text-slate-900 text-sm outline-none
                               focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63] transition-colors placeholder:text-slate-400"
                  />
                </div>

                {/* Role Dropdown (Bounded strictly to container width for mobile screen safety) */}
                <div className="mb-3.5 relative" ref={roleDropdownRef}>
                  <label
                    htmlFor="login-role"
                    className="block text-xs font-bold uppercase tracking-wider text-[#123b63] mb-1"
                  >
                    Jurisdiction / Role
                  </label>
                  <div className="relative w-full">
                    <button
                      id="login-role"
                      type="button"
                      onClick={() => setRoleDropdownOpen((prev) => !prev)}
                      aria-haspopup="listbox"
                      aria-expanded={roleDropdownOpen}
                      className="w-full flex items-center justify-between px-3 py-2 rounded border border-slate-300 bg-white text-slate-900 text-sm outline-none focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63] transition-colors cursor-pointer text-left"
                    >
                      <span className={form.role ? "text-slate-900 font-medium truncate" : "text-slate-400 truncate"}>
                        {ROLES.find((r) => r.value === form.role)?.label || "Select administrative role…"}
                      </span>
                      <TbChevronDown
                        size={16}
                        className={`text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${
                          roleDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <input type="hidden" name="role" value={form.role} />

                    {roleDropdownOpen && (
                      <div
                        role="listbox"
                        aria-label="Jurisdiction / Role"
                        className="absolute left-0 right-0 top-full mt-1 w-full max-w-full bg-white border border-slate-300 rounded-lg shadow-xl z-50 py-1 max-h-60 overflow-y-auto no-scrollbar"
                      >
                        {ROLES.map((r) => {
                          const isSelected = form.role === r.value;
                          return (
                            <div
                              key={r.value}
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => {
                                setForm((prev) => ({ ...prev, role: r.value }));
                                setError("");
                                setRoleDropdownOpen(false);
                              }}
                              className={`px-3 py-2 text-xs sm:text-sm flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-[#123b63] text-white font-semibold"
                                  : "text-slate-800 hover:bg-slate-100"
                              }`}
                            >
                              <span className="truncate">{r.label}</span>
                              {!r.ready && (
                                <span
                                  className={`text-[9.5px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                                    isSelected
                                      ? "bg-white/20 text-white"
                                      : "bg-slate-100 text-slate-500 border border-slate-200"
                                  }`}
                                >
                                  Soon
                                </span>
                              )}
                              {r.ready && isSelected && (
                                <IoShieldCheckmark size={14} className="text-cyan-300 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Role badge — shown once a role is selected */}
                  {form.role && (
                    <p className="mt-1.5 text-[11px] text-[#123b63] font-semibold flex items-center gap-1.5 truncate">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-600 shrink-0"></span>
                      <span className="truncate">
                        Target Portal: {ROLES.find((r) => r.value === form.role)?.portal || form.role}
                      </span>
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="mb-1">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold uppercase tracking-wider text-[#123b63] mb-1"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your security password"
                      className="w-full px-3 py-2 pr-12 rounded border border-slate-300 bg-white text-slate-900 text-sm outline-none
                                 focus:border-[#123b63] focus:ring-1 focus:ring-[#123b63] transition-colors placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <TbEyeOff size={18} />
                      ) : (
                        <TbEye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Forgot password */}
                <div className="flex justify-end mb-3 mt-1.5">
                  <button
                    type="button"
                    className="text-xs text-[#123b63] hover:underline font-semibold transition-colors duration-150 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Error message */}
                {error && (
                  <p role="alert" aria-live="assertive" className="mb-4 text-xs font-medium text-red-700 bg-red-50 border border-red-300 rounded px-3 py-2">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded font-bold text-sm text-white
                             bg-[#123b63] hover:bg-[#0c2a47] active:scale-[0.99]
                             transition-colors shadow-none
                             disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Authenticating…
                    </>
                  ) : (
                    <>
                      <TbLogin size={16} />
                      Sign In to Dashboard
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-3.5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Back to home */}
              <button
                onClick={() => navigate("/")}
                className="w-full py-2 rounded font-semibold text-xs sm:text-sm text-[#123b63] border border-slate-300 bg-white
                           hover:bg-slate-50 transition-colors cursor-pointer"
              >
                ← Return to Public Map & Monitoring
              </button>
              {/* Footer note inside card */}
              <p className="mt-3 text-center text-[11px] text-slate-500 font-medium">
                Authorized government officials only. Statutory compliance and audit logging active under MoSPI guidelines.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
