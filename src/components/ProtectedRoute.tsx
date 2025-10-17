import { useUser } from '@clerk/clerk-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export const ProtectedRoute = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const location = useLocation();
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const verifyUser = async () => {
      if (isLoaded && isSignedIn && user) {
        // If metadata is missing, reload to get fresh data from Clerk's servers
        if (!user.publicMetadata.db_id) {
          try {
            await user.reload();
          } catch (error) {
            console.error("ProtectedRoute: Failed to reload user:", error);
          }
        }
        setIsVerified(true);
      }
    };

    if (isLoaded && !isSignedIn) {
      setIsVerified(true);
    } else if (isLoaded && isSignedIn) {
      verifyUser();
    }
  }, [isLoaded, isSignedIn, user]);

  // Show loading while Clerk loads or we're verifying metadata
  if (!isLoaded || !isVerified) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        Loading your session...
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }
  
  const hasProfile = user?.publicMetadata?.db_id;
  const currentPath = location.pathname;

  // Allow access to complete-profile page regardless of db_id
  if (currentPath === '/complete-profile') {
    // If user already has profile, redirect to dashboard
    if (hasProfile) {
      return <Navigate to="/dashboard" replace />;
    }
    // Otherwise, let them access the page to complete their profile
    return <Outlet />;
  }

  // For all other protected routes (like dashboard), require profile completion
  if (!hasProfile) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <Outlet />;
};