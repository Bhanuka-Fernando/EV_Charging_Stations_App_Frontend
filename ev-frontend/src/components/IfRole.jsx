import { useRole } from "../auth/useRole";
export default function IfRole({ in: allowed = [], children }) {
  const role = useRole();
  if (!role || !allowed.includes(role)) return null;
  return children;
}
