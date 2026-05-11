import { useState } from "react";
function AccountSettings() {
  const [toggles, setToggles] = useState({
    email: true,
    campaigns: true,
    messages: true,
    marketing: false,
  });

  const handleToggle = (key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="account-bg">
      <div className="p-8">
        <div className="max-w-4xl mx-auto mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-500 mt-1">
            Manage your account preferences and security
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="settings-section-card">
            <h2 className="section-title">Profile Information</h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="settings-label">First Name</label>
                <input
                  type="text"
                  defaultValue="John"
                  className="settings-input"
                />
              </div>
              <div>
                <label className="settings-label">Last Name</label>
                <input
                  type="text"
                  defaultValue="Doe"
                  className="settings-input"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="settings-label">Email Address</label>
              <input
                type="email"
                defaultValue="john@example.com"
                className="settings-input"
              />
            </div>

            <div>
              <label className="settings-label">Phone Number</label>
              <input
                type="tel"
                defaultValue="+971 50 123 4567"
                className="settings-input"
              />
            </div>
          </div>

          <div className="settings-section-card">
            <h2 className="section-title">
              <img
                src="/src/assets/lock.svg"
                alt="Security"
                width={20}
                height={20}
              />
              Password & Security
            </h2>

            <div className="mb-6">
              <label className="settings-label">Current Password</label>
              <input
                type="password"
                placeholder="Enter current password"
                className="settings-input"
              />
            </div>

            <div className="mb-6">
              <label className="settings-label">New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                className="settings-input"
              />
            </div>

            <div className="mb-6">
              <label className="settings-label">Confirm New Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                className="settings-input"
              />
            </div>

            <button className="btn-update-pass">Update Password</button>
          </div>

          <div className="settings-section-card">
            <h2 className="section-title">
              <img
                src="/src/assets/bell.svg"
                alt="Notifications"
                width={20}
                height={20}
              />
              Notification Preferences
            </h2>

            <div className="toggle-row">
              <div>
                <div className="font-medium text-gray-900">
                  Email Notifications
                </div>
                <div className="text-sm text-gray-500">
                  Receive updates via email
                </div>
              </div>
              <div
                className={`toggle-switch ${toggles.email ? "active" : ""}`}
                onClick={() => handleToggle("email")}
              >
                <div className="toggle-circle"></div>
              </div>
            </div>

            <div className="toggle-row">
              <div>
                <div className="font-medium text-gray-900">
                  Campaign Updates
                </div>
                <div className="text-sm text-gray-500">
                  Get notified about campaign activities
                </div>
              </div>
              <div
                className={`toggle-switch ${toggles.campaigns ? "active" : ""}`}
                onClick={() => handleToggle("campaigns")}
              >
                <div className="toggle-circle"></div>
              </div>
            </div>

            <div className="toggle-row">
              <div>
                <div className="font-medium text-gray-900">Messages</div>
                <div className="text-sm text-gray-500">
                  Get notified when you receive messages
                </div>
              </div>
              <div
                className={`toggle-switch ${toggles.messages ? "active" : ""}`}
                onClick={() => handleToggle("messages")}
              >
                <div className="toggle-circle"></div>
              </div>
            </div>

            <div className="toggle-row">
              <div>
                <div className="font-medium text-gray-900">
                  Marketing Emails
                </div>
                <div className="text-sm text-gray-500">
                  Receive promotional content and updates
                </div>
              </div>
              <div
                className={`toggle-switch ${toggles.marketing ? "active" : ""}`}
                onClick={() => handleToggle("marketing")}
              >
                <div className="toggle-circle"></div>
              </div>
            </div>
          </div>

          <div className="danger-card">
            <h2 className="danger-text">Danger Zone</h2>

            <button className="btn-danger-outline">Deactivate Account</button>
            <button className="btn-danger-outline">
              Delete Account Permanently
            </button>
          </div>

          <button className="btn-save-primary">
            <img src="/src/assets/save.svg" alt="Save" width={20} height={20} />
            Save All Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default AccountSettings;
