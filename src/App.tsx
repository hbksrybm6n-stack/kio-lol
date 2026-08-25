import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import LandingPage from '@/pages/LandingPage';
import RegisterPage from '@/pages/RegisterPage';
import LoginPage from '@/pages/LoginPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import UsernameSetupPage from '@/pages/UsernameSetupPage';
import DashboardLayout from '@/pages/DashboardLayout';
import DashboardOverview from '@/pages/DashboardOverview';
import DashboardProfile from '@/pages/DashboardProfile';
import DashboardAppearance from '@/pages/DashboardAppearance';
import DashboardLinks from '@/pages/DashboardLinks';
import DashboardSocials from '@/pages/DashboardSocials';
import DashboardBackground from '@/pages/DashboardBackground';
import DashboardMusic from '@/pages/DashboardMusic';
import DashboardEffects from '@/pages/DashboardEffects';
import DashboardBadges from '@/pages/DashboardBadges';
import DashboardDiscord from '@/pages/DashboardDiscord';
import DashboardWidgets from '@/pages/DashboardWidgets';
import DashboardAnalytics from '@/pages/DashboardAnalytics';
import DashboardTemplates from '@/pages/DashboardTemplates';
import DashboardSettings from '@/pages/DashboardSettings';
import AdminDashboard from '@/pages/AdminDashboard';
import ProfilePage from '@/pages/ProfilePage';

export default function App() {
  const { initialize, initialized } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!initialized) {
    return (
      <div className="min-h-screen bg-[var(--color-nx-bg)] flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-[var(--color-nx-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--color-nx-surface-2)',
            color: 'var(--color-nx-text)',
            border: '1px solid var(--color-nx-border)',
            borderRadius: '10px',
            fontSize: '13px',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/setup" element={<UsernameSetupPage />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="profile" element={<DashboardProfile />} />
          <Route path="appearance" element={<DashboardAppearance />} />
          <Route path="links" element={<DashboardLinks />} />
          <Route path="socials" element={<DashboardSocials />} />
          <Route path="background" element={<DashboardBackground />} />
          <Route path="music" element={<DashboardMusic />} />
          <Route path="effects" element={<DashboardEffects />} />
          <Route path="badges" element={<DashboardBadges />} />
          <Route path="discord" element={<DashboardDiscord />} />
          <Route path="widgets" element={<DashboardWidgets />} />
          <Route path="analytics" element={<DashboardAnalytics />} />
          <Route path="templates" element={<DashboardTemplates />} />
          <Route path="settings" element={<DashboardSettings />} />
        </Route>

        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/@:username" element={<ProfilePage />} />
        <Route path="/:username" element={<ProfilePage />} />
      </Routes>
    </BrowserRouter>
  );
}
