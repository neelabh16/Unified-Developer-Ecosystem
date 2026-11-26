import { Suspense } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Skeleton from '../components/common/Skeleton';
import ProtectedRoute from './ProtectedRoute';
import {
  CodexPage,
  CommunitiesPage,
  CommunityDetailPage,
  ExplorePage,
  HackathonDetailPage,
  HackathonsPage,
  HomePage,
  LeaderboardPage,
  LoginPage,
  PortfolioPage,
  ProfilePage,
  ProjectDetailPage,
  SettingsPage,
  SignupPage,
  SquadsPage,
  SubmitProjectPage,
} from './LazyRoutes';

function RouteLoadingFallback() {
  return (
    <div className="wrap py-16" data-testid="route-loading-fallback">
      <div className="glass p-8">
        <Skeleton variant="line" width="35%" className="mb-4" />
        <Skeleton variant="line" count={3} className="mb-3" />
      </div>
    </div>
  );
}

function PreserveSearchRedirect({ to }) {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}`} replace />;
}

function LegacyDetailRedirect({ basePath, fallbackPath }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (id) {
    params.delete('id');
    const rest = params.toString();
    return (
      <Navigate
        to={`${basePath}/${encodeURIComponent(id)}${rest ? `?${rest}` : ''}`}
        replace
      />
    );
  }
  return <Navigate to={`${fallbackPath}${location.search}`} replace />;
}

function LegacyUserRedirect({ basePath }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const username = params.get('u');
  if (username) {
    params.delete('u');
    const rest = params.toString();
    return (
      <Navigate
        to={`${basePath}/${encodeURIComponent(username)}${rest ? `?${rest}` : ''}`}
        replace
      />
    );
  }
  return <Navigate to={`${basePath}${location.search}`} replace />;
}

function NotFoundPage() {
  return (
    <div className="wrap py-20" data-testid="not-found-page">
      <div className="glass mx-auto max-w-lg p-10 text-center">
        <span className="eyebrow">404 · Not Found</span>
        <h1 className="mb-3 text-4xl font-bold">Signal lost in the DevVerse</h1>
        <p className="mb-6 text-sm text-[var(--text-secondary)]">
          The page or route you requested does not exist or has moved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className="btn btn-primary btn-sm">
            Return home
          </Link>
          <Link to="/explore" className="btn btn-ghost btn-sm">
            Explore projects
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AppRouter() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          {/* Main application shell */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route
              path="/submit-project"
              element={
                <ProtectedRoute>
                  <SubmitProjectPage />
                </ProtectedRoute>
              }
            />
            <Route path="/hackathons" element={<HackathonsPage />} />
            <Route path="/hackathons/:id" element={<HackathonDetailPage />} />
            <Route
              path="/squads"
              element={
                <ProtectedRoute>
                  <SquadsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/communities" element={<CommunitiesPage />} />
            <Route path="/communities/:id" element={<CommunityDetailPage />} />
            <Route path="/codex" element={<CodexPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route
              path="/portfolio"
              element={
                <ProtectedRoute>
                  <PortfolioPage />
                </ProtectedRoute>
              }
            />
            <Route path="/portfolio/:username" element={<PortfolioPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* 404 fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Auth shell */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          {/* OAuth & Legacy HTML compatibility redirects */}
          <Route path="/login.html" element={<PreserveSearchRedirect to="/login" />} />
          <Route path="/signup.html" element={<PreserveSearchRedirect to="/signup" />} />
          <Route path="/index.html" element={<PreserveSearchRedirect to="/" />} />
          <Route path="/explore.html" element={<PreserveSearchRedirect to="/explore" />} />
          <Route
            path="/submit-project.html"
            element={<PreserveSearchRedirect to="/submit-project" />}
          />
          <Route
            path="/hackathons.html"
            element={<PreserveSearchRedirect to="/hackathons" />}
          />
          <Route path="/squads.html" element={<PreserveSearchRedirect to="/squads" />} />
          <Route
            path="/communities.html"
            element={<PreserveSearchRedirect to="/communities" />}
          />
          <Route path="/codex.html" element={<PreserveSearchRedirect to="/codex" />} />
          <Route
            path="/leaderboard.html"
            element={<PreserveSearchRedirect to="/leaderboard" />}
          />
          <Route path="/settings.html" element={<PreserveSearchRedirect to="/settings" />} />

          <Route
            path="/project"
            element={<LegacyDetailRedirect basePath="/projects" fallbackPath="/explore" />}
          />
          <Route
            path="/project.html"
            element={<LegacyDetailRedirect basePath="/projects" fallbackPath="/explore" />}
          />
          <Route
            path="/hackathon"
            element={
              <LegacyDetailRedirect basePath="/hackathons" fallbackPath="/hackathons" />
            }
          />
          <Route
            path="/hackathon.html"
            element={
              <LegacyDetailRedirect basePath="/hackathons" fallbackPath="/hackathons" />
            }
          />
          <Route
            path="/community"
            element={
              <LegacyDetailRedirect basePath="/communities" fallbackPath="/communities" />
            }
          />
          <Route
            path="/community.html"
            element={
              <LegacyDetailRedirect basePath="/communities" fallbackPath="/communities" />
            }
          />
          <Route path="/profile.html" element={<LegacyUserRedirect basePath="/profile" />} />
          <Route
            path="/portfolio.html"
            element={<LegacyUserRedirect basePath="/portfolio" />}
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
