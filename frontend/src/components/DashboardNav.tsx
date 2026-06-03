import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Title } from "../components";
import { outreachApi } from "../api";

function DashboardNav() {
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await outreachApi.getMyRequests();
        const pendingCount = data.filter((req: any) => req.status === "pending" || req.status === "sent" || req.status === "opened").length;
        setRequestCount(pendingCount);
      } catch (err) {
        console.error("Failed to fetch requests count", err);
      }
    };
    fetchRequests();

    const handleUpdate = () => {
      fetchRequests();
    };
    window.addEventListener("outreach_handled", handleUpdate);

    return () => {
      window.removeEventListener("outreach_handled", handleUpdate);
    };
  }, []);

  return (
    <div className="flex justify-between items-center bg-white p-4 border-b border-gray-200">
      <Link to={"/influencer-dashboard"}>
        <Title />
      </Link>
      <div className="flex items-center gap-5 text-lg">
        <Link to={"/influencer-messages"} className="cursor-pointer" title="Campaign messages">
          <img src="/assets/message-square-green.svg" alt="Messages" width={22} height={22} />
        </Link>
        <Link
          to={"/influencer-requests"}
          className="flex items-center gap-2 cursor-pointer"
        >
          <img src="/assets/users.svg" alt="Requests" />
          {requestCount > 0 && (
            <span className="bg-red-500 text-white rounded-full px-2 py-0.5 text-sm font-medium">
              {requestCount}
            </span>
          )}
        </Link>
        <Link to={"/influencer-settings"} className="cursor-pointer">
          <img src="src/assets/settings.svg" alt="" />
        </Link>
      </div>
    </div>
  );
}

export default DashboardNav;
