import { useState, useEffect } from "react";
import { dashboardApi } from "../../api";

function Notification() {
  const [activeTab, setActiveTab] = useState("All");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await dashboardApi.getBusinessDashboardStats();
        // Map recent activity to the notification format
        if (res.data && res.data.recentActivity) {
          const mapped = res.data.recentActivity.map((activity: any, index: number) => ({
            id: activity.id || index,
            type: activity.type === "campaign" ? "Campaigns" : "Messages",
            title: activity.type === "campaign" ? "Campaign Update" : "Outreach Request",
            desc: activity.text,
            time: new Date(activity.date).toLocaleString(),
            isUnread: false,
            iconColor: activity.type === "campaign" ? "icon-purple" : "icon-blue",
            icon: (
              <img
                src={
                  activity.type === "campaign"
                    ? "/src/assets/briefcase-business-.svg"
                    : "/src/assets/message-square-green.svg"
                }
                alt={activity.type}
                width={20}
                height={20}
              />
            ),
          }));
          setNotifications(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const filteredNotifications =
    activeTab === "All"
      ? notifications
      : notifications.filter((n) => n.type === activeTab);

  return (
    <div className="notifications-bg">
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-500 mt-1">
              Stay updated with your latest activities
            </p>
          </div>
          <button className="btn-mark-read">Mark all as read</button>
        </div>

        <div className="tabs-container">
          {["All", "Campaigns", "Messages", "Approvals"].map((tab) => (
            <div
              key={tab}
              className={`tab-item ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
              {tab === "All" && notifications.length > 0 && (
                <span className="tab-count">{notifications.length}</span>
              )}
            </div>
          ))}
        </div>

        <div>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
             <div className="text-center py-20 text-gray-400 bg-white border border-gray-200 rounded-xl">
               <img
                 src="/src/assets/loader-circle.svg"
                 alt="No notifications"
                 className="w-12 h-12 mx-auto mb-4 opacity-50"
               />
               <p className="text-lg mb-2">You're all caught up!</p>
               <p className="text-sm">
                 When important activities happen on your account, you will see them here.
               </p>
             </div>
          ) : (
            filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`notif-card ${item.isUnread ? "unread" : ""}`}
              >
                <div className={`notif-icon-box ${item.iconColor}`}>
                  {item.icon}
                </div>

                <div className="flex-1">
                  <div className="notif-header">
                    <span className="notif-title">{item.title}</span>
                    <span className="notif-time">{item.time}</span>
                  </div>
                  <div className="notif-desc">{item.desc}</div>

                  {item.isUnread && <span className="badge-unread">Unread</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Notification;
