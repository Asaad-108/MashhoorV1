import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: "business" | "influencer";
}

function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== allowedRole) {
    // Redirect to their own dashboard if they're logged in as wrong role
    return (
      <Navigate
        to={
          user?.role === "business"
            ? "/business-dashboard"
            : "/influencer-dashboard"
        }
        replace
      />
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;
