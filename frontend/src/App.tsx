import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
  LoginPage,
  RegisterPage,
  DashboardPage,
  MessesPage,
  ExpensesPage,
  SettlementsPage,
  MembersPage,
  CollectionsPage
} from './pages';
import TestPage from './pages/TestPage';
import { ProtectedRoute } from './components/auth';
import { ErrorBoundary, Layout } from './components/shared';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/test" element={<TestPage />} />

          {/* Protected Routes with Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/messes"
            element={
              <ProtectedRoute>
                <Layout>
                  <MessesPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <Layout>
                  <ExpensesPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settlements"
            element={
              <ProtectedRoute>
                <Layout>
                  <SettlementsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/members"
            element={
              <ProtectedRoute>
                <Layout>
                  <MembersPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/collections"
            element={
              <ProtectedRoute>
                <Layout>
                  <CollectionsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-blue-600 mb-4">
                      Settings
                    </h1>
                    <p className="text-gray-600">
                      Settings coming soon.
                    </p>
                  </div>
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-blue-600 mb-4">
                      Profile
                    </h1>
                    <p className="text-gray-600">
                      Profile page coming soon.
                    </p>
                  </div>
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
