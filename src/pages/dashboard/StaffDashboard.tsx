import { useUser, useAuth } from '@clerk/clerk-react';
import { useQuery } from '@apollo/client/react';
import { GET_DONOR_DASHBOARD_DATA } from '../../graphql/queries';
import { type DashboardQueryData } from '../../types';
import { useEffect } from 'react';

export const StaffDashboard = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const dbUserId = user?.publicMetadata.db_id as string;

  // Debug: Log the token to verify JWT claims
  useEffect(() => {
    const checkToken = async () => {
      const token = await getToken({ template: 'hasura' });
      console.log('Hasura Token:', token);
      console.log('Decode this token at jwt.io to see the claims');
    };
    checkToken();
  }, [getToken]);

  const { loading, error, data } = useQuery<DashboardQueryData, { userId: string }>(
    GET_DONOR_DASHBOARD_DATA,
    {
      variables: { userId: dbUserId },
      skip: !dbUserId,
    }
  );

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh' 
      }}>
        Loading your dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <p style={{ color: '#ef4444', fontSize: '1.2rem' }}>
          Error loading your profile: {error.message}
        </p>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          Check the browser console for your JWT token and verify it at jwt.io
        </p>
      </div>
    );
  }

  const userProfile = data?.users_by_pk;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        Welcome back, {userProfile?.name}!
      </h2>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '1.5rem', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <p style={{ marginBottom: '0.5rem' }}>
          Your blood group is: <strong>{userProfile?.blood_group}</strong>
        </p>
        <p>
          Your last donation was on:{' '}
          <strong>
            {userProfile?.last_donation_date
              ? new Date(userProfile.last_donation_date).toLocaleDateString()
              : 'N/A'}
          </strong>
        </p>
      </div>

      <p style={{ marginTop: '2rem', color: '#6b7280', fontStyle: 'italic' }}>
        Dashboard features like the map and camp lists will be built here.
      </p>
    </div>
  );
};