import React from "react";
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
import Dashboard from "./pages/Dashboard"; // Import Dashboard
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import EditProperty from "./pages/EditProperty";
import Favorites from "./pages/Favorites";

const Navigation = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="p-4 bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link
          to="/"
          className="text-xl font-bold text-indigo-600 tracking-tight"
        >
          Backroom
        </Link>
        <div className="space-x-4 flex items-center">
          <Link
            to="/"
            className="text-slate-600 hover:text-indigo-600 transition-colors font-medium"
          >
            Explore
          </Link>

          {user ? (
            <>
              <Link
                to="/favorites"
                className="text-slate-600 hover:text-rose-600 transition-colors font-medium ml-4"
              >
                Saved
              </Link>

              {(user.role === "host" || user.role === "admin") && (
                <Link
                  to="/dashboard"
                  className="text-slate-600 hover:text-indigo-600 transition-colors font-medium ml-4"
                >
                  Dashboard
                </Link>
              )}
              <span className="text-sm text-slate-500 border-l border-slate-300 pl-4 hidden md:inline-block ml-4">
                Welcome,{" "}
                <span className="font-semibold text-slate-800">
                  {user.name}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="text-slate-600 hover:text-red-600 transition-colors font-medium ml-4"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-slate-600 hover:text-indigo-600 transition-colors font-medium border-l border-slate-300 pl-4"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors ml-4"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <main className="max-w-7xl mx-auto p-4 py-8">
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
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
