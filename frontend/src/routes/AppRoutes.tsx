import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "../App.css";
import {
  About,
  AccountSettings,
  AuthLayout,
  BusinessDashboard,
  BusinessLayout,
  CampaignDetails,
  Campaigns,
  CreateCampaign,
  Features,
  FindInfluencers,
  InfluencerDashboard,
  InfluencerLayout,
  LandingPage,
  Login,
  Messages,
  Notification,
  PublicLayout,
  Requests,
  Reset,
  Settings,
  SignUp,
  Working,
  InfluencerDetails,
} from "../layouts/index";
import ScrollToTop from "./ScrollToTop";
import ProtectedRoute from "./ProtectedRoute";

export function AppRoutes() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route
            path="/"
            element={
              <>
                <section id="home"><LandingPage /></section>
                <section id="features"><Features /></section>
                <section id="working"><Working /></section>
                <section id="about"><About /></section>
              </>
            }
          />
        </Route>

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/reset" element={<Reset />} />
        </Route>

        {/* Business Routes — protected */}
        <Route element={<BusinessLayout />}>
          <Route path="/business-dashboard" element={<ProtectedRoute allowedRole="business"><BusinessDashboard /></ProtectedRoute>} />
          <Route path="/find-influencers" element={<ProtectedRoute allowedRole="business"><FindInfluencers /></ProtectedRoute>} />
          <Route path="/business-campaigns" element={<ProtectedRoute allowedRole="business"><Campaigns /></ProtectedRoute>} />
          <Route path="/create-campaigns" element={<ProtectedRoute allowedRole="business"><CreateCampaign /></ProtectedRoute>} />
          <Route path="/business-settings" element={<ProtectedRoute allowedRole="business"><AccountSettings /></ProtectedRoute>} />
          <Route path="/business-notifications" element={<ProtectedRoute allowedRole="business"><Notification /></ProtectedRoute>} />
          <Route path="/business-messages" element={<ProtectedRoute allowedRole="business"><Messages /></ProtectedRoute>} />
          <Route path="/influencer/:id" element={<ProtectedRoute allowedRole="business"><InfluencerDetails /></ProtectedRoute>} />
        </Route>

        {/* Influencer Routes — protected */}
        <Route element={<InfluencerLayout />}>
          <Route path="/influencer-dashboard" element={<ProtectedRoute allowedRole="influencer"><InfluencerDashboard /></ProtectedRoute>} />
          <Route path="/campaign-details/:id" element={<ProtectedRoute allowedRole="influencer"><CampaignDetails /></ProtectedRoute>} />
          <Route path="/influencer-requests" element={<ProtectedRoute allowedRole="influencer"><Requests /></ProtectedRoute>} />
          <Route path="/influencer-settings" element={<ProtectedRoute allowedRole="influencer"><Settings /></ProtectedRoute>} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default AppRoutes;
