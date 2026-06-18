import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { Button, Icon } from "./ui";

function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = window.localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;

    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    return prefersDark ? "dark" : "light";
  });

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  const navItems = [
    ["Dashboard", "/dashboard", "dashboard"],
    ["Translator", "/translator", "translate"],
    ["Entities", "/entities", "entity"],
    ["Sentence", "/sentence", "sentence"],
    ["Pronunciation", "/pronunciation", "mic"],
    ["OCR", "/ocr", "scan"],
  ];

  const displayName =
    currentUser?.user_metadata?.displayName ||
    currentUser?.user_metadata?.full_name ||
    currentUser?.email ||
    "Learner";
  const initials = displayName
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const linkClass = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
      isActive
        ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 dark:ring-indigo-800"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
    }`;

  const drawerLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
      isActive
        ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300 dark:ring-indigo-800"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
    }`;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="hidden sm:block" />

        <Link to="/" className="flex items-center gap-3" onClick={() => setDrawerOpen(false)}>
          <img src="/logo.png" alt="Ainthamizh AI" className="h-11 w-11" />
          <span>
            <span className="block text-base font-bold text-gray-950 dark:text-gray-100">Ainthamizh AI</span>
            <span className="block text-xs text-gray-500 dark:text-gray-400">Tamil learning workspace</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 lg:flex">
          <Button
            type="button"
            variant="ghost"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="px-3 py-2"
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} className="h-4 w-4" />
          </Button>
          {navItems.map(([label, href, icon]) => (
            <NavLink key={href} to={href} className={linkClass}>
              <Icon name={icon} className="h-4 w-4" />
              {label}
            </NavLink>
          ))}

          {currentUser ? (
            <div className="flex items-center gap-1 rounded-2xl border border-gray-200 bg-white p-1 pl-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2 rounded-xl transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 p-1"
                title="Go to Profile"
              >
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  {initials || "AI"}
                </span>
                <span className="hidden max-w-32 truncate pr-2 text-sm font-semibold text-gray-700 dark:text-gray-200 sm:block">
                  {displayName}
                </span>
              </button>
              <Button type="button" variant="ghost" onClick={logout} className="px-3 py-2">
                Logout
              </Button>
            </div>
          ) : (
            <Button as={Link} to="/login" className="px-4 py-2">
              Login
            </Button>
          )}
        </nav>

        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex rounded-2xl border border-gray-200 p-3 text-gray-700 transition hover:bg-gray-100 lg:hidden dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <Icon name="menu" className="h-5 w-5" />
        </button>
      </div>

      <div
        className={`fixed inset-0 z-50 bg-gray-950/30 transition lg:hidden ${
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-screen w-80 max-w-[86vw] border-l border-gray-200 bg-white p-5 shadow-2xl transition-transform duration-200 lg:hidden dark:border-gray-800 dark:bg-gray-950 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Ainthamizh AI" className="h-10 w-10" />
            <span className="font-bold text-gray-950 dark:text-gray-100">Ainthamizh AI</span>
          </div>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setDrawerOpen(false)}
            className="rounded-2xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-950 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            <Icon name="clear" className="h-5 w-5" />
          </button>
        </div>

        <nav className="grid gap-2">
          {navItems.map(([label, href, icon]) => (
            <NavLink
              key={href}
              to={href}
              onClick={() => setDrawerOpen(false)}
              className={drawerLinkClass}
            >
              <Icon name={icon} className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 border-t border-gray-100 pt-5 dark:border-gray-800">
          {currentUser ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  navigate("/profile");
                  setDrawerOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-2xl bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                  {initials || "AI"}
                </span>
                <span className="min-w-0 truncate text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {displayName}
                </span>
              </button>
              <Button type="button" variant="secondary" onClick={logout} className="w-full">
                Logout
              </Button>
            </div>
          ) : (
            <Button as={Link} to="/login" onClick={() => setDrawerOpen(false)} className="w-full">
              Login
            </Button>
          )}
        </div>
      </aside>
    </header>
  );
}

export default Navbar;
