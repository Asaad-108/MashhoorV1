import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/client";
import { campaignApi } from "../../api/campaignApi";
import type { Campaign } from "../../api/campaignApi";
import { outreachApi } from "../../api/outreachApi";

interface InfluencerProfile {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar: string;
  };
  niche: string[];
  location: string;
  bio: string;
  platforms: {
    youtube?: {
      handle: string;
      subscribers: number;
      avgViews: number;
      engagementRate: number;
    };
    instagram?: {
      handle: string;
      followers: number;
      engagementRate: number;
    };
    tiktok?: {
      handle: string;
      followers: number;
      engagementRate: number;
    };
  };
  trustScore: number;
  totalFollowers: number;
  avgEngagementRate: number;
  tags: string[];
}

export default function InfluencerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<InfluencerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/influencers/${id}`);
        setProfile(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProfile();
  }, [id]);

  useEffect(() => {
    if (showModal) {
      campaignApi.getMyCampaigns()
        .then(res => setCampaigns(res.data))
        .catch(err => setModalError("Failed to load campaigns"));
    }
  }, [showModal]);

  const handleSendRequest = async () => {
    if (!selectedCampaign) return setModalError("Please select a campaign");
    if (!message) return setModalError("Please add a message");
    
    setSending(true);
    setModalError("");
    try {
      if (profile) {
        await outreachApi.send(selectedCampaign, profile.user._id, message);
        setShowModal(false);
        setMessage("");
        setSelectedCampaign("");
        alert("Request sent successfully!");
      }
    } catch(err: any) {
       setModalError(err.response?.data?.message || "Failed to send request");
    } finally {
       setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9fafb] p-8 flex justify-center items-center">
        <div className="animate-pulse text-xl text-gray-500">Loading profile data from YouTube API...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#f9fafb] p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">
          {error || "Profile not found."}
        </div>
        <button onClick={() => navigate(-1)} className="mt-4 text-purple-600 hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  const { user, location, bio, tags, totalFollowers, avgEngagementRate, trustScore, niche, platforms } = profile;
  
  const followersStr = totalFollowers >= 1000 ? `${(totalFollowers / 1000).toFixed(0)}K` : String(totalFollowers);
  
  const avgReach = platforms?.youtube?.avgViews 
    ? (platforms.youtube.avgViews >= 1000 ? `${(platforms.youtube.avgViews / 1000).toFixed(0)}K` : platforms.youtube.avgViews)
    : "0";

  return (
    <div className="min-h-screen bg-[#f9fafb] p-4 md:p-8 relative">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-200 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-6 md:items-start">
          <img 
            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=8b5cf6&color=fff`} 
            alt={user.name} 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border border-gray-100"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                  <span className="bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    Verified
                  </span>
                </div>
                <p className="text-gray-600 font-medium mb-3">{niche.join(" & ")} Creator</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {location || "Unknown"}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    {followersStr} followers
                  </span>
                  <span className="flex items-center gap-1">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    {avgEngagementRate.toFixed(1)}% engagement
                  </span>
                </div>
                <p className="text-sm text-gray-600 max-w-3xl leading-relaxed mb-4 whitespace-pre-wrap">
                  {bio}
                </p>
                <div className="flex flex-wrap gap-2">
                  {tags?.length > 0 ? tags.map(tag => (
                    <span key={tag} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">{tag}</span>
                  )) : niche.map(n => (
                    <span key={n} className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">{n}</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  Contact
                </button>
                <button 
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add to Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="text-sm text-gray-500 font-medium mb-2 flex justify-between">
            Trust Score <span className="text-orange-500">❖</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{trustScore}/100</div>
            <div className="text-xs text-green-600 font-medium">{trustScore >= 80 ? "Excellent rating" : trustScore >= 60 ? "Good rating" : "Average rating"}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="text-sm text-gray-500 font-medium mb-2 flex justify-between">
            Avg. Reach <span className="text-purple-500">↗</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{avgReach}</div>
            <div className="text-xs text-gray-500">Per post</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="text-sm text-gray-500 font-medium mb-2 flex justify-between">
            Collaborations <span className="text-gray-400">👥</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-1">0</div>
            <div className="text-xs text-gray-500">Successful campaigns</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="text-sm text-gray-500 font-medium mb-2 flex justify-between">
            Response Rate <span className="text-gray-400">♡</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-1">0%</div>
            <div className="text-xs text-gray-500">Within 24h</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button className="px-4 py-3 text-sm font-bold text-gray-900 border-b-2 border-gray-900 bg-white rounded-t-lg shadow-[0_-2px_0_0_rgba(0,0,0,0.05)]">
          Past Collaborations
        </button>
      </div>

      {/* Past Collaborations Content */}
      <div className="space-y-4">
        <div className="text-center py-10 text-gray-500 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          This influencer has no past campaigns yet.
        </div>
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Add to Campaign</h2>
            
            {modalError && (
              <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                {modalError}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Campaign</label>
              <select 
                value={selectedCampaign}
                onChange={e => setSelectedCampaign(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-purple-500 bg-gray-50"
              >
                <option value="">-- Choose a campaign --</option>
                {campaigns.map(c => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
              {campaigns.length === 0 && (
                 <p className="text-xs text-orange-500 mt-2">You don't have any campaigns yet. Create one first.</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Message to Influencer</label>
              <textarea 
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Hi! We'd love to collaborate with you on this campaign..."
                className="w-full border border-gray-200 rounded-lg p-3 text-gray-900 focus:outline-none focus:border-purple-500 bg-gray-50"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSendRequest}
                disabled={sending || campaigns.length === 0}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {sending ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
