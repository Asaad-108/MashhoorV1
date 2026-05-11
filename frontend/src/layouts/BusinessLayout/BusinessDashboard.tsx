import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { dashboardApi } from "../../api";

function BusinessDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardApi.getBusinessDashboardStats();
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
    <div className="business-bg">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name || "Business User"}
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your campaigns today.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex justify-between items-start">
              <span className="stat-label">Total Campaigns</span>
              <div className="text-gray-400">
                <img
                  src="/src/assets/globe.svg"
                  alt="Campaigns"
                  width={20}
                  height={20}
                />
              </div>
            </div>
            <div className="stat-number">{loading ? "-" : stats?.totalCampaigns || 0}</div>
            <div className="stat-trend text-gray-400">Total created</div>
          </div>

          <div className="stat-card">
            <div className="flex justify-between items-start">
              <span className="stat-label">Influencers Contacted</span>
              <div className="text-gray-400">
                <img
                  src="/src/assets/user.svg"
                  alt="Contacted"
                  width={20}
                  height={20}
                />
              </div>
            </div>
            <div className="stat-number">{loading ? "-" : stats?.influencersContacted || 0}</div>
            <div className="stat-trend text-gray-400">Outreach requests</div>
          </div>

          <div className="stat-card">
            <div className="flex justify-between items-start">
              <span className="stat-label">Shortlisted</span>
              <div className="text-gray-400">
                <img
                  src="/src/assets/eye.svg"
                  alt="Shortlisted"
                  width={20}
                  height={20}
                />
              </div>
            </div>
            <div className="stat-number">{loading ? "-" : stats?.shortlisted || 0}</div>
            <div className="stat-trend text-gray-400">Pending review</div>
          </div>

          <div className="stat-card">
            <div className="flex justify-between items-start">
              <span className="stat-label">Avg. Engagement</span>
              <div className="text-gray-400">
                <img
                  src="/src/assets/chart-line.svg"
                  alt="Engagement"
                  width={20}
                  height={20}
                />
              </div>
            </div>
            <div className="stat-number">{loading ? "-" : stats?.avgEngagement || "0.0%"}</div>
            <div className="stat-trend text-gray-400">Across campaigns</div>
          </div>
        </div>

        <div className="action-section">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Quick Actions</h3>
            <p className="text-sm text-gray-500">
              Start working on your campaigns
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/create-campaigns" className="btn-create-campaign">
              <img
                src="/src/assets/plus (1).svg"
                alt="Create"
                width={20}
                height={20}
              />
              Create New Campaign
            </Link>

            <Link to="/find-influencers" className="search-influencer w-full flex items-center gap-2 justify-start decoration-transparent">
              <img
                src="/src/assets/search.svg"
                alt="Search"
                width={20}
                height={20}
              />
              <span>Find Influencers</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="dashboard-card">
            <div className="chart-title">Campaign Activity</div>
            <div className="chart-subtitle">Number of campaigns over time</div>

            <div className="flex items-end justify-between h-48 pt-4 pb-2 border-b border-gray-100">
              <div className="w-full flex justify-around items-end h-full">
                {/* Empty states for new users */}
                <div className="w-12 bg-[#8b5cf6] rounded-t-md" style={{ height: stats?.totalCampaigns ? "30%" : "0%" }}></div>
                <div className="w-12 bg-[#8b5cf6] rounded-t-md" style={{ height: stats?.totalCampaigns ? "45%" : "0%" }}></div>
                <div className="w-12 bg-[#8b5cf6] rounded-t-md" style={{ height: stats?.totalCampaigns ? "35%" : "0%" }}></div>
                <div className="w-12 bg-[#8b5cf6] rounded-t-md" style={{ height: stats?.totalCampaigns ? "60%" : "0%" }}></div>
                <div className="w-12 bg-[#8b5cf6] rounded-t-md" style={{ height: stats?.totalCampaigns ? "75%" : "0%" }}></div>
                <div className="w-12 bg-[#8b5cf6] rounded-t-md" style={{ height: stats?.totalCampaigns ? "95%" : "0%" }}></div>
              </div>
            </div>
            <div className="flex justify-around mt-2 text-xs text-gray-400">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="chart-title">Engagement Trend</div>
            <div className="chart-subtitle">Average engagement rate (%)</div>

            <div className="relative h-48 pt-4 pb-2 border-b border-gray-100">
              <div className="w-full h-full relative">
                {stats?.totalCampaigns ? (
                  <svg className="w-full h-full" viewBox="0 0 300 150" preserveAspectRatio="none">
                    <line x1="0" y1="37" x2="300" y2="37" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />
                    <line x1="0" y1="75" x2="300" y2="75" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />
                    <line x1="0" y1="112" x2="300" y2="112" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="4" />
                    <polyline points="10,120 60,90 120,95 180,60 240,40 290,20" fill="none" stroke="#8b5cf6" strokeWidth="2" />
                    <circle cx="10" cy="120" r="3" fill="white" stroke="#8b5cf6" strokeWidth="2" />
                    <circle cx="60" cy="90" r="3" fill="white" stroke="#8b5cf6" strokeWidth="2" />
                    <circle cx="120" cy="95" r="3" fill="white" stroke="#8b5cf6" strokeWidth="2" />
                    <circle cx="180" cy="60" r="3" fill="white" stroke="#8b5cf6" strokeWidth="2" />
                    <circle cx="240" cy="40" r="3" fill="white" stroke="#8b5cf6" strokeWidth="2" />
                    <circle cx="290" cy="20" r="3" fill="white" stroke="#8b5cf6" strokeWidth="2" />
                  </svg>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                    No engagement data yet
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-around mt-2 text-xs text-gray-400">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 text-lg">
              Recent Activity
            </h3>
            <p className="text-sm text-gray-500">Your latest interactions</p>
          </div>

          <div className="flex flex-col">
            {loading ? (
              <div className="text-gray-400 py-4">Loading activity...</div>
            ) : (!stats?.recentActivity || stats.recentActivity.length === 0) ? (
              <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-lg">
                <p>No recent activity.</p>
                <p className="text-sm mt-1">Create a campaign to get started!</p>
              </div>
            ) : (
              stats.recentActivity.map((activity: any) => (
                <div key={activity.id} className="activity-item">
                  <div>
                    <div className="text-gray-900 font-medium">
                      {activity.text}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(activity.date).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`tag ${activity.type === 'campaign' ? 'tag-purple' : 'tag-blue'}`}>
                    {activity.type}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusinessDashboard;
