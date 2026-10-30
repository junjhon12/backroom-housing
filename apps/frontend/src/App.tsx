import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import Home from "./pages/Home";
import PropertyDetails from "./pages/PropertyDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateProperty from "./pages/CreateProperty";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import EditProperty from "./pages/EditProperty";
import Favorites from "./pages/Favorites";
import NotFound from "./pages/NotFound";
import { buttonStyles } from "./components/ui";

const NAV_LINK =
  "text-[10px] uppercase tracking-[0.18em] text-cream/80 hover:text-moss transition-colors";

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  const closeMenu = () => setMenuOpen(false);

  const links: Array<{ to: string; label: string }> = [{ to: "/", label: "Explore" }];

  if (user) {
    links.push({ to: "/favorites", label: "Saved" });
    if (user.role === "host" || user.role === "admin") {
      links.push({ to: "/dashboard", label: "Dashboard" });
    }
  }

  return (
    <nav aria-label="Main" className="sticky top-0 z-30 border-b border-ink bg-ink text-cream">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link
          to="/"
          onClick={closeMenu}
          className="font-display text-xl uppercase leading-none tracking-wide"
        >
          Backroom
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className={NAV_LINK}>
              {link.label}
            </Link>
          ))}

          {user ? (
            <>
              <span className="border-l border-cream/25 pl-6 text-[10px] uppercase tracking-[0.18em] text-cream/60">
                {user.name}
              </span>
              <button type="button" onClick={handleLogout} className={NAV_LINK}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={NAV_LINK}>
                Sign in
              </Link>
              <Link
                to="/register"
                className={buttonStyles({
                  variant: "secondary",
                  size: "sm",
                  className: "border-cream text-cream hover:bg-cream hover:text-ink",
                })}
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          className="border border-cream/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] md:hidden"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-cream/20 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <Link key={link.to} to={link.to} onClick={closeMenu} className={NAV_LINK}>
                {link.label}
              </Link>
            ))}

            {user ? (
              <>
                <span className="border-t border-cream/20 pt-4 text-[10px] uppercase tracking-[0.18em] text-cream/60">
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`${NAV_LINK} text-left`}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu} className={NAV_LINK}>
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className={buttonStyles({
                    variant: "secondary",
                    size: "sm",
                    className:
                      "border-cream text-cream hover:bg-cream hover:text-ink self-start",
                  })}
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex min-h-screen flex-col bg-paper">
        <Navigation />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/property/:id" element={<PropertyDetails />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/favorites" element={<Favorites />} />
            </Route>
            <Route
              element={<ProtectedRoute allowedRoles={["host", "admin"]} />}
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/property/new" element={<CreateProperty />} />
              <Route path="/property/edit/:id" element={<EditProperty />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <footer className="border-t border-ink/30">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-[10px] uppercase tracking-[0.18em] text-ink/60 md:flex-row md:justify-between">
            <span>Backroom Housing — A subsidiary of nowhere</span>
            <span>Est. 2026 / All units subject to availability</span>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
