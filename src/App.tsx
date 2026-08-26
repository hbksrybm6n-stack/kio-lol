import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import CookieBanner from '@/components/CookieBanner';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage'));
const UsernameSetupPage = lazy(() => import('@/pages/UsernameSetupPage'));
const DashboardLayout = lazy(() => import('@/pages/DashboardLayout'));
const DashboardOverview = lazy(() => import('@/pages/DashboardOverview'));
const DashboardProfile = lazy(() => import('@/pages/DashboardProfile'));
const DashboardAppearance = lazy(() => import('@/pages/DashboardAppearance'));
const DashboardLinks = lazy(() => import('@/pages/DashboardLinks'));
const DashboardSocials = lazy(() => import('@/pages/DashboardSocials'));
const DashboardBackground = lazy(() => import('@/pages/DashboardBackground'));
const DashboardMusic = lazy(() => import('@/pages/DashboardMusic'));
const DashboardEffects = lazy(() => import('@/pages/DashboardEffects'));
const DashboardBadges = lazy(() => import('@/pages/DashboardBadges'));
const DashboardDiscord = lazy(() => import('@/pages/DashboardDiscord'));
const DashboardWidgets = lazy(() => import('@/pages/DashboardWidgets'));
const DashboardAnalytics = lazy(() => import('@/pages/DashboardAnalytics'));
const DashboardTemplates = lazy(() => import('@/pages/DashboardTemplates'));
const DashboardSettings = lazy(() => import('@/pages/DashboardSettings'));
const DashboardAccount = lazy(() => import('@/pages/DashboardAccount'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const DiscoveryPage = lazy(() => import('@/pages/DiscoveryPage'));
const LegalPage = lazy(() => import('@/pages/LegalPage'));
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const ForbiddenPage = lazy(() => import('@/pages/ForbiddenPage'));
const ErrorPage = lazy(() => import('@/pages/ErrorPage'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-white/10 border-t-white rounded-full animate-spin" />
        <p className="text-[12px] text-[#3f3f46]">Loading...</p>
      </div>
    </div>
  );
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

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
      <CookieBanner />
      <SuspenseWrapper>
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
            <Route path="account" element={<DashboardAccount />} />
          </Route>

          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/discover" element={<DiscoveryPage />} />
          <Route path="/legal/:slug" element={<LegalPage />} />
          <Route path="/forbidden" element={<ForbiddenPage />} />

          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/@:username" element={<ProfilePage />} />

          <Route path="/error" element={<ErrorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </SuspenseWrapper>
    </BrowserRouter>
  );
}
