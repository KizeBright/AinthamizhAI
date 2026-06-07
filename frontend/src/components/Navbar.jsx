import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { currentUser, logout } = useAuth();

  const navItems = [
    ["Dashboard", "/dashboard"],
    ["Translator", "/translator"],
    ["Entities", "/entities"],
    ["Sentence", "/sentence"],
    ["Pronunciation", "/pronunciation"],
    ["OCR", "/ocr"],
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-700 text-lg font-black text-white">
            அ
          </span>
          <span>
            <span className="block text-base font-bold text-slate-950">
              Ainthamizh AI
            </span>
            <span className="block text-xs text-slate-500">
              Tamil learning workspace
            </span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map(([label, href]) => (
            <NavLink
              key={href}
              to={href}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`
              }
            >
              {label}
            </NavLink>
          ))}

          {currentUser ? (
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
