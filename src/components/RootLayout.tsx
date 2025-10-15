import { Outlet, Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';

export const RootLayout = () => {
  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #eee' }}>
        <Link to="/" style={{ fontWeight: 'bold', textDecoration: 'none', color: 'black' }}>LifeLine</Link>
        <SignedOut>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/sign-in">Sign In</Link>
            <Link to="/sign-up">Sign Up</Link>
          </div>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>
      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
};