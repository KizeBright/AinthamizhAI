import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="mt-8 rounded-2xl border border-gray-200 bg-white/60 p-6 shadow-[0_16px_42px_rgba(17,24,39,0.06)] backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/60 sm:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
            Ainthamizh AI
          </p>
          <h3 className="mt-3 text-lg font-bold text-gray-950 dark:text-gray-50">
            Learn Tamil with practice-first tools.
          </h3>
          <p className="mt-2 helper-text">
            Translation, pronunciation feedback, OCR, entity recognition, and
            sentence generation — in one workspace.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Explore</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link className="text-indigo-700 hover:underline" to="/translator">
                  Translator
                </Link>
              </li>
              <li>
                <Link className="text-indigo-700 hover:underline" to="/pronunciation">
                  Pronunciation
                </Link>
              </li>
              <li>
                <Link className="text-indigo-700 hover:underline" to="/ocr">
                  OCR Scanner
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Account</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link className="text-indigo-700 hover:underline" to="/dashboard">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link className="text-indigo-700 hover:underline" to="/profile">
                  Profile
                </Link>
              </li>
              <li>
                <Link className="text-indigo-700 hover:underline" to="/login">
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2 border-t border-gray-100 pt-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} Ainthamizh AI</span>
        <span>Built for DTEC Hackathon</span>
      </div>
    </footer>
  );
}

export default Footer;

