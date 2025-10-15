import { useUser, useClerk } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const DashboardPage = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAndFetchProfile = async () => {
      if (!isLoaded || !user) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('clerk_id', user.id)
          .single();

        if (error || !data) {
          navigate('/complete-profile', { replace: true });
        } else {
          setUserProfile(data);
          setIsChecking(false);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        navigate('/complete-profile', { replace: true });
      }
    };

    checkAndFetchProfile();
  }, [isLoaded, user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  if (!isLoaded || isChecking) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <p style={{ color: 'white', fontSize: '1.1rem' }}>Loading your dashboard...</p>
      </div>
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <header style={{ 
        backgroundColor: 'white', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#667eea' }}>🩸 LifeLine</h1>
        <button 
          onClick={handleSignOut}
          style={{
            padding: '0.5rem 1.25rem',
            backgroundColor: 'transparent',
            color: '#667eea',
            border: '1px solid #667eea',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500,
            fontSize: '0.95rem'
          }}
        >
          Sign Out
        </button>
      </header>

      {/* Main Content */}
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ margin: '0 0 0.5rem', color: '#1f2937', fontSize: '2rem' }}>
            Welcome back, {userProfile.name.split(' ')[0]}! 👋
          </h2>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '1rem' }}>
            {userProfile.role === 'donor' 
              ? 'Ready to save lives? Check out nearby blood drives below.'
              : 'Manage your blood bank operations and coordinate with donors.'}
          </p>
        </div>

        {/* Profile Card */}
        <div style={{ 
          backgroundColor: 'white',
          padding: '1.5rem', 
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#374151', fontSize: '1.25rem' }}>
            Your Profile
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>Email</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', color: '#1f2937' }}>{userProfile.email}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>Role</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', color: '#1f2937' }}>
                {userProfile.role === 'donor' ? '🩸 Blood Donor' : '🏥 Blood Bank Staff'}
              </p>
            </div>
            {userProfile.blood_group && (
              <div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>Blood Group</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', color: '#1f2937', fontWeight: 600 }}>
                  {userProfile.blood_group}
                </p>
              </div>
            )}
            {userProfile.last_donation_date && (
              <div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>Last Donation</p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', color: '#1f2937' }}>
                  {new Date(userProfile.last_donation_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            )}
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280', fontWeight: 500 }}>Member Since</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', color: '#1f2937' }}>
                {new Date(userProfile.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        {/* What's Next Section */}
        <div style={{ 
          backgroundColor: '#eff6ff',
          padding: '1.5rem', 
          borderRadius: '12px',
          border: '1px solid #bfdbfe'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#1e40af', fontSize: '1.25rem' }}>
            What's Next?
          </h3>
          {userProfile.role === 'donor' ? (
            <div>
              <p style={{ color: '#1e3a8a', marginBottom: '1rem' }}>
                As a blood donor, you can now:
              </p>
              <ul style={{ color: '#1e3a8a', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                <li>Find nearby blood drives based on your location</li>
                <li>Schedule donation appointments</li>
                <li>Track your donation history</li>
                <li>Receive notifications about urgent blood needs</li>
                <li>View your eligibility status for donations</li>
              </ul>
            </div>
          ) : (
            <div>
              <p style={{ color: '#1e3a8a', marginBottom: '1rem' }}>
                As blood bank staff, you can now:
              </p>
              <ul style={{ color: '#1e3a8a', lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                <li>Create and manage blood drives</li>
                <li>Track blood inventory levels</li>
                <li>Coordinate with donors</li>
                <li>Send urgent notifications to nearby donors</li>
                <li>Monitor donation appointments</li>
              </ul>
            </div>
          )}
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'white', borderRadius: '8px' }}>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
              💡 <strong>Coming Soon:</strong> Full dashboard features are being developed. Stay tuned!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};