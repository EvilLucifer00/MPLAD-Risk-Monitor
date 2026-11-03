import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TbEye, TbEyeOff, TbLogin, TbChevronDown } from "react-icons/tb";
import { IoShieldCheckmark } from "react-icons/io5";
import { authApi } from "../../api/auth";
import { useAuthStore } from "../../store/useAuthStore";
import IndianMonumentsSkyline from "../../components/shared/IndianMonumentsSkyline";
import EmblemImage from "../../components/shared/EmblemImage";

const LoginPage = () => {
  const navigate = useNavigate();
  const { token, role, setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", role: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

    setLoading(true);
    setError("");

    try {
      const loginRes = await authApi.login({
        username: form.username.trim(),
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
    <div className="h-screen flex flex-col w-full bg-slate-50 relative overflow-hidden">
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

      {/* ── Navbar ── */}
      <div className="sticky top-0 z-50 flex-none flex items-center px-4 md:px-8 py-2.5 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-200">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 group"
          aria-label="Back to home"
        >
          <EmblemImage
            width="44"
            height="44"
            className="w-11 h-11 object-contain"
          />
          <h2 className="text-2xl font-bold text-slate-800 group-hover:text-[#123b63] transition-colors duration-200">
            MPLADS Risk Monitor
          </h2>
        </button>
      </div>

      {/* ── Main Content ── */}
      <main id="main-content" className="flex flex-1 items-center justify-center px-4 py-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="relative overflow-hidden rounded-3xl shadow-2xl bg-white border border-slate-200">
            {/* Card top banner — same gradient style as hero */}
            <div
              className="relative px-8 pt-8 pb-6 bg-cover bg-center bg-mplad-headquarters"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#123b63]/95 via-[#123b63]/75 to-black/30" />
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  <EmblemImage
                    width="36"
                    height="44"
                    alt="Government of India"
                    className="w-9 h-11 object-contain"
                  />
                  <div className="text-white leading-tight">
                    <p className="text-[10px] uppercase tracking-wider text-slate-100 font-bold mb-0.5">
                      Government of India
                    </p>
                    <p className="font-semibold text-xs drop-shadow-sm">
                      Ministry of Statistics and Programme Implementation
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <IoShieldCheckmark size={20} className="text-cyan-400" />
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">
                    Secure Login
                  </h1>
                </div>
                <p className="text-slate-300 text-xs text-center leading-relaxed">
                  Sign in to access the MPLADS Risk Monitoring Dashboard
                </p>
              </div>
            </div>

            {/* Form body */}
            <div className="px-6 py-4">
              <form onSubmit={handleSubmit} noValidate>
                {/* Username */}
                <div className="mb-3">
                  <label
                    htmlFor="login-username"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Username / Email
                  </label>
                  <input
                    id="login-username"
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Enter your username or email"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm outline-none
                               focus:ring-[3px] focus:ring-blue-500/20 focus:border-[#123b63] transition-all duration-200 placeholder:text-slate-400"
                  />
                </div>

                {/* Role Dropdown */}
                <div className="mb-3">
                  <label
                    htmlFor="login-role"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Login As
                  </label>
                  <div className="relative">
                    <select
                      id="login-role"
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      className="w-full appearance-none px-3 py-2 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm outline-none
                                 focus:ring-[3px] focus:ring-blue-500/20 focus:border-[#123b63] transition-all duration-200
                                 cursor-pointer"
                    >
                      <option value="" disabled>
                        Select your role…
                      </option>
                      <option value="mp">Member of Parliament (MP)</option>
                      <option value="district_authority">
                        District Authority
                      </option>
                      <option value="state_authority">State Authority</option>
                      <option value="pwd_cpwd">PWD / CPWD</option>
                      <option value="minister_mospi">Minister of MoSPI</option>
                    </select>
                    <TbChevronDown
                      size={16}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                  {/* Role badge — shown once a role is selected */}
                  {form.role && (
                    <p className="mt-1.5 text-[11px] text-[#123b63] font-medium flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                      {
                        {
                          mp: "Member of Parliament portal",
                          district_authority: "District Authority portal",
                          state_authority: "State Authority portal",
                          pwd_cpwd: "PWD / CPWD portal",
                          minister_mospi: "Minister of MoSPI portal",
                        }[form.role]
                      }
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="mb-1">
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-semibold text-slate-700 mb-1"
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
                      placeholder="Enter your password"
                      className="w-full px-3 py-2 pr-12 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm outline-none
                                 focus:ring-[3px] focus:ring-blue-500/20 focus:border-[#123b63] transition-all duration-200 placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
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
                    className="text-xs text-[#123b63] hover:text-cyan-600 font-medium transition-colors duration-150"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Error message */}
                {error && (
                  <p role="alert" aria-live="assertive" className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white
                             bg-[#123b63] hover:bg-[#0f2f50] active:scale-[0.98]
                             transition-all duration-200 shadow-md shadow-[#123b63]/30
                             disabled:opacity-60 disabled:cursor-not-allowed"
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
                      Signing in…
                    </>
                  ) : (
                    <>
                      <TbLogin size={16} />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-600 font-medium">or</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Back to home */}
              <button
                onClick={() => navigate("/")}
                className="w-full py-2 rounded-xl font-semibold text-sm text-[#123b63] border border-slate-200
                           hover:bg-slate-50 transition-all duration-200"
              >
                ← Back to Home
              </button>
              {/* Footer note inside card */}
              <p className="mt-3 text-center text-[11px] text-slate-600 leading-relaxed font-medium">
                Authorised government officials only. Unauthorised access is
                prohibited.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
