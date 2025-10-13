import { useAuth } from "../auth/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Unauthorized() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const logout = () => { signOut(); navigate("/login", { replace: true }); };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm text-center">
        <h1 className="text-2xl font-semibold mb-2">Access denied</h1>
        <p className="text-sm text-gray-600 mb-6">
          This web app is only for Backoffice and Station Operator roles.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={logout} className="rounded-xl bg-black text-white px-4 py-2">
            Logout
          </button>
          <Link to="/login" className="text-blue-600">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
