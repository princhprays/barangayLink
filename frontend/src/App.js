import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// Components
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Benefits from './pages/Benefits';
import Authentication from './components/auth/Authentication';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminManagement from './components/admin/AdminManagement';
import Verifications from './components/admin/Verifications';
import UserManagement from './components/admin/UserManagement';
import ResidentDashboard from './components/ResidentDashboard';
import ItemsList from './components/items/ItemsList';
import MyItems from './components/items/MyItems';
import AddItem from './components/items/AddItem';
import PendingItems from './components/admin/PendingItems';
import Profile from './components/profile/Profile';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import RequestManagement from './components/admin/RequestManagement';
import MyRequests from './components/items/MyRequests';
import CreateRequest from './components/items/CreateRequest';

// Scroll to top component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Don't scroll to top for auth pages - let the auth component handle its own scrolling
    if (!pathname.includes('/auth') && !pathname.includes('/login') && !pathname.includes('/register')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pathname]);

  return null;
};

// Protected Route Component
const ProtectedRoute = ({ children, requireVerified = false }) => {
  const { isAuthenticated, isVerified, loading, authReady } = useAuth();
  
  if (loading || !authReady) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  if (requireVerified && !isVerified) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

// Main App Component
const AppContent = () => {
  const { isAuthenticated } = useAuth();
  return (
    <Router>
      <ScrollToTop />
      <div className={`App`}>
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/benefits" element={<Benefits />} />
            <Route path="/auth" element={<Authentication />} />
            <Route path="/login" element={<Authentication initialForm="login" />} />
            <Route path="/register" element={<Authentication initialForm="resident" />} />
            
            {/* Profile Management */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              } 
            />
            
            <Route 
              path="/admin/management" 
              element={
                <ProtectedAdminRoute>
                  <AdminManagement />
                </ProtectedAdminRoute>
              } 
            />
            
            <Route 
              path="/admin/verifications" 
              element={
                <ProtectedAdminRoute>
                  <Verifications />
                </ProtectedAdminRoute>
              } 
            />

            <Route 
              path="/admin/items/pending" 
              element={
                <ProtectedAdminRoute>
                  <PendingItems />
                </ProtectedAdminRoute>
              } 
            />

            <Route 
              path="/admin/users" 
              element={
                <ProtectedAdminRoute>
                  <UserManagement />
                </ProtectedAdminRoute>
              } 
            />
            
            {/* Resident Routes */}
            <Route 
              path="/resident/dashboard" 
              element={
                <ProtectedRoute requireVerified>
                  <ResidentDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Routes - Will be implemented in future weeks */}
            <Route 
              path="/items" 
              element={
                <ProtectedRoute>
                  <ItemsList />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/my-items" 
              element={
                <ProtectedRoute requireVerified>
                  <MyItems />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/items/new" 
              element={
                <ProtectedRoute requireVerified>
                  <AddItem />
                </ProtectedRoute>
              } 
            />

            {/* Request System Routes */}
            <Route 
              path="/admin/requests" 
              element={
                <ProtectedAdminRoute>
                  <RequestManagement />
                </ProtectedAdminRoute>
              } 
            />
            
            <Route 
              path="/requests/new" 
              element={
                <ProtectedRoute requireVerified>
                  <CreateRequest />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/my-requests" 
              element={
                <ProtectedRoute requireVerified>
                  <MyRequests />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

// Root App Component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

