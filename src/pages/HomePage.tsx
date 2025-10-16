import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

console.log('Environment Check:', {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    clerkKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
    allEnvKeys: Object.keys(import.meta.env)
  });

export const HomePage = () => {
  const { isSignedIn } = useUser();

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '2rem'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '3rem', margin: '0 0 1rem', fontWeight: 'bold' }}>
          🩸 LifeLine
        </h1>
        <p style={{ fontSize: '1.25rem', marginBottom: '2rem', opacity: 0.9 }}>
          Connecting blood donors with those in need. Find blood drives near you and save lives.
        </p>
        
        {isSignedIn ? (
          <Link 
            to="/dashboard"
            style={{
              display: 'inline-block',
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              backgroundColor: 'white',
              color: '#667eea',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            Go to Dashboard
          </Link>
        ) : (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link 
              to="/sign-up"
              style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                backgroundColor: 'white',
                color: '#667eea',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              Get Started
            </Link>
            <Link 
              to="/sign-in"
              style={{
                display: 'inline-block',
                padding: '1rem 2rem',
                fontSize: '1.1rem',
                backgroundColor: 'transparent',
                color: 'white',
                textDecoration: 'none',
                border: '2px solid white',
                borderRadius: '8px',
                fontWeight: 'bold'
              }}
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};