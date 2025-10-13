import { Link } from "react-router-dom";
import { UserRound } from "lucide-react"; // npm i lucide-react

export default function ProfileIconLink({ className = "" }) {
  return (
    <Link
      to="/me/profile"
      aria-label="My Profile"
      title="My Profile"
      className={
        "inline-flex items-center justify-center rounded-full border px-3 py-2 hover:bg-gray-50 " +
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 " + className
      }
    >
      <UserRound size={20} />
      <span className="ml-2 text-sm font-medium hidden sm:inline">Profile</span>
    </Link>
  );
}
