import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SignInPage } from './pages/SignInPage';
import { SignUpPage } from './pages/SignUpPage';
import { CompleteProfilePage } from './pages/CompleteProfilePage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DonorDashboard } from './pages/dashboard/DonorDashboard';
import { StaffDashboard } from './pages/dashboard/StaffDashboard';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ApolloProviderWithClerk } from './components/ApolloProviderWithClerk';
import { RootLayout } from './components/layout/RootLayout';

function App() {
  return (
    <ApolloProviderWithClerk>
      <Routes>
        <Route element={<RootLayout />}>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/complete-profile" element={<CompleteProfilePage />} />
            
            {/* Dashboard Routes with Layout */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              {/* Default redirect based on role - handled in DashboardLayout */}
              <Route index element={<div>Redirecting...</div>} />
              
              {/* Role-specific dashboards */}
              <Route path="donor" element={<DonorDashboard />} />
              <Route path="staff" element={<StaffDashboard />} />
              <Route path="admin" element={<AdminDashboard />} />
              
              {/* Admin-specific routes */}
              <Route path="admin/staff-approval" element={<div>Staff Approval Page Coming Soon</div>} />
              
              {/* Staff-specific routes */}
              <Route path="staff/inventory" element={<div>Inventory Page Coming Soon</div>} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </ApolloProviderWithClerk>
  );
}

export default App;