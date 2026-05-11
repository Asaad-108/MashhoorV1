import { Link, NavLink, useNavigate } from "react-router-dom";
import { Title } from "../components";
import { useAuth } from "../context/AuthContext";

function BusinessNav() {
  const navigate = useNavigate();

  return (
    <>
      <div className="business-nav">
        <div className="flex items-center gap-8">
          <Link to="/business-dashboard">
            <Title />
          </Link>
          <div className="flex">
            <NavLink to="/business-dashboard" className={({ isActive }) => `${isActive ? "nav-link active" : "nav-link"}`}>
              Dashboard
            </NavLink>
            <NavLink to="/find-influencers" className={({ isActive }) => `${isActive ? "nav-link active" : "nav-link"}`}>
              Find Influencers
            </NavLink>
            <NavLink to="/business-campaigns" className={({ isActive }) => `${isActive ? "nav-link active" : "nav-link"}`}>
              Campaigns
            </NavLink>
            <NavLink to="/business-messages" className={({ isActive }) => `${isActive ? "nav-link active" : "nav-link"}`}>
              Messages
            </NavLink>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/business-notifications" className="text-gray-500 hover:text-gray-900">
            <img src="/src/assets/bell.svg" alt="Notifications" width={20} height={20} />
          </Link>
          <Link to="/business-settings" className="text-gray-500 hover:text-gray-900">
            <img src="/src/assets/settings.svg" alt="Settings" width={20} height={20} />
          </Link>
        </div>
      </div>
    </>
  );
}

export default BusinessNav;
