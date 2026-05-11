import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { dashboardApi } from "../../api";
import { Link } from "react-router-dom";

function InfluencerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardApi.getInfluencerDashboardStats();
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <>
      <div className="dashboard-bg ">
        <div className="p-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Welcome back, {user?.name || "Influencer"}!
              </h1>
              <p className="text-gray-400 mt-2 text-lg">
                Here's your performance overview
              </p>
            </div>
          </div>

          <div className="flex gap-6 mb-8">
            <div className="card-white flex-1">
              <div className="flex justify-between text-gray-500">
                <span>Total Earnings</span>
                <span>
                  <img src="/src/assets/dollar-sign.svg" alt="" />
                </span>
              </div>
              <div className="stat-value">
                {loading ? "-" : `$${(stats?.totalEarnings || 0).toLocaleString()}`}
              </div>
              <div className="stat-sub text-gray-400">Lifetime earnings</div>
            </div>

            <div className="card-white flex-1">
              <div className="flex justify-between text-gray-500">
                <span>Active Campaigns</span>
                <span>
                  <img src="/src/assets/briefcase-business.svg" alt="" />
                </span>
              </div>
              <div className="stat-value">{loading ? "-" : stats?.activeCampaigns || 0}</div>
              <div className="stat-sub text-gray-400">Currently running</div>
            </div>

            <div className="card-white flex-1">
              <div className="flex justify-between text-gray-500">
                <span>Pending Requests</span>
                <span>
                  <img src="/src/assets/loader-circle.svg" alt="" />
                </span>
              </div>
              <div className="stat-value">{loading ? "-" : stats?.pendingRequests || 0}</div>
              <Link to="/influencer-requests" className="stat-sub text-purple-600 cursor-pointer block mt-1">
                View requests →
              </Link>
            </div>

            <div className="card-white flex-1">
              <div className="flex justify-between text-gray-500">
                <span>Trust Score</span>
                <span>
                  <img src="/src/assets/chart-line.svg" alt="" />
                </span>
              </div>
              <div className="stat-value">{loading ? "-" : `${stats?.trustScore || 0}/100`}</div>
              <div className="stat-sub text-green">
                {stats?.trustScore > 80 ? "Excellent rating" : stats?.trustScore > 0 ? "Good rating" : "New account"}
              </div>
            </div>
          </div>

          <div className="flex gap-6 mb-8">
            <div className="card-white w-2/3">
              <div className="text-lg font-semibold mb-2">
                Earnings Overview
              </div>

              <div className="relative">
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 pb-8">
                  <span>8000</span>
                  <span>6000</span>
                  <span>4000</span>
                  <span>2000</span>
                  <span>0</span>
                </div>

                <div className="ml-10">
                  <div className="chart-container">
                    {/* Placeholder chart. Shows empty for new users. */}
                    <div className="bar" style={{ height: stats?.totalEarnings ? "40%" : "0%" }}></div>
                    <div className="bar" style={{ height: stats?.totalEarnings ? "55%" : "0%" }}></div>
                    <div className="bar" style={{ height: stats?.totalEarnings ? "45%" : "0%" }}></div>
                    <div className="bar" style={{ height: stats?.totalEarnings ? "65%" : "0%" }}></div>
                    <div className="bar" style={{ height: stats?.totalEarnings ? "75%" : "0%" }}></div>
                    <div className="bar" style={{ height: stats?.totalEarnings ? "95%" : "0%" }}></div>
                  </div>
                  <div className="flex justify-between mt-2 text-gray-400 text-sm px-2">
                    <span>Jan</span>
                    <span>Feb</span>
                    <span>Mar</span>
                    <span>Apr</span>
                    <span>May</span>
                    <span>Jun</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-1/3 flex flex-col gap-4">
              <div className="text-lg font-semibold mb-2 ml-1">
                Quick Actions
              </div>

              <Link to="/influencer-settings" className="action-btn block">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-md flex-shrink-0">
                    <img src="/src/assets/square-pen.svg" alt="" />
                  </div>
                  <div className="font-medium">Update Profile</div>
                </div>
              </Link>

              <Link to="/influencer-requests" className="action-btn block">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-md flex-shrink-0">
                    <img src="/src/assets/users.svg" alt="" />
                  </div>
                  <div className="font-medium">View Campaign Requests</div>
                </div>
              </Link>

              <Link to="/influencer-settings" className="action-btn block">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-md flex-shrink-0">
                    <img src="/src/assets/lock.svg" alt="" />
                  </div>
                  <div className="font-medium">Privacy & Consent Settings</div>
                </div>
              </Link>
            </div>
          </div>

          <div className="card-white">
            <div className="text-lg font-semibold mb-4">Active Campaigns</div>
            
            {loading ? (
               <div className="text-gray-400 py-4">Loading campaigns...</div>
            ) : (!stats?.recentCampaigns || stats.recentCampaigns.length === 0) ? (
              <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-lg">
                <p>No active campaigns yet.</p>
                <p className="text-sm mt-1">When businesses hire you, campaigns will appear here.</p>
              </div>
            ) : (
              stats.recentCampaigns.map((camp: any) => (
                <div key={camp._id} className="campaign-row">
                  <div>
                    <div className="font-medium text-lg">{camp.title}</div>
                    <div className="text-gray-400 text-sm">{camp.business?.name || "Business"}</div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="badge badge-blue capitalize">{camp.status}</span>
                    <span className="font-semibold text-lg">
                      {camp.budget?.currency} {camp.budget?.total?.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default InfluencerDashboard;
