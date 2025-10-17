import { Outlet, Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';

export const RootLayout = () => {
  return (
    <div>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 2rem',
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <Link to="/" style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          textDecoration: 'none',
          color: '#667eea'
        }}>
          🩸 LifeLine
        </Link>
        
        <SignedOut>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link to="/sign-in" style={{
              textDecoration: 'none',
              color: '#4f46e5',
              fontWeight: 500
            }}>
              Sign In
            </Link>
            <Link to="/sign-up" style={{
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              backgroundColor: '#667eea',
              color: 'white',
              borderRadius: '6px',
              fontWeight: 500
            }}>
              Sign Up
            </Link>
          </div>
        </SignedOut>

        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>
      
      <main>
        {/* All your page components will be rendered here */}
        <Outlet />
      </main>
    </div>
  );
};