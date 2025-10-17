import { useUser, useAuth } from '@clerk/clerk-react';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['donor', 'staff']),
  blood_group: z.string().optional(),
  last_donation_date: z.string().optional(),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
}).refine(data => {
  if (data.role === 'donor' && (!data.blood_group || data.blood_group === '')) {
    return false;
  }
  return true;
}, {
  message: 'Blood group is required for donors',
  path: ['blood_group'],
});

type ProfileFormData = z.infer<typeof profileSchema>;

export const CompleteProfilePage = () => {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      role: 'donor',
    }
  });

  const role = watch('role');

  // FIX: Redirect existing users to dashboard
  useEffect(() => {
    if (isLoaded && user?.publicMetadata.db_id) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoaded, user, navigate]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('fetching');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setValue('location', { lat: latitude, lng: longitude }, { shouldValidate: true });
        setLocationStatus('success');
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationStatus('error');
        alert('Unable to retrieve your location. Please ensure location access is enabled.');
      }
    );
  };

  const onSubmit = async (data: ProfileFormData) => {
    setSubmitError('');
    try {
      const token = await getToken();

      const response = await fetch('/api/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const res = await response.json();
        throw new Error(res.error || 'Failed to create profile.');
      }

      if (user) {
        await user.reload(); 
      }

      navigate('/dashboard', { replace: true });

    } catch (err: any) {
      console.error('Error creating profile:', err);
      setSubmitError(err.message);
    }
  };

  if (!isLoaded) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <p style={{ color: 'white', fontSize: '1.1rem' }}>Loading...</p>
      </div>
    );
  }

  // Don't render the form if user already has a profile (redirect will happen)
  if (user?.publicMetadata.db_id) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <p style={{ color: 'white', fontSize: '1.1rem' }}>Redirecting...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '550px', 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#1f2937' }}>Complete Your Profile</h2>
        <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1.5rem' }}>
          We need a few more details to set up your account.
        </p>
        
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#374151' }}>I am a:</label>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" {...register('role')} value="donor" />
                <span style={{ fontSize: '0.95rem' }}>🩸 Blood Donor</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" {...register('role')} value="staff" />
                <span style={{ fontSize: '0.95rem' }}>🏥 Blood Bank Staff</span>
              </label>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0.25rem 0' }} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>
                First Name *
              </label>
              <input 
                {...register('firstName')} 
                type="text" 
                placeholder="John" 
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  fontSize: '1rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px',
                  boxSizing: 'border-box'
                }}
              />
              {errors.firstName && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>{errors.firstName.message}</p>}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>
                Last Name *
              </label>
              <input 
                {...register('lastName')} 
                type="text" 
                placeholder="Doe" 
                style={{ 
                  width: '100%', 
                  padding: '0.75rem', 
                  fontSize: '1rem', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px',
                  boxSizing: 'border-box'
                }}
              />
              {errors.lastName && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>{errors.lastName.message}</p>}
            </div>
          </div>

          {role === 'donor' && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>
                  Blood Group *
                </label>
                <select 
                  {...register('blood_group')}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    fontSize: '1rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    boxSizing: 'border-box',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Select your blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
                {errors.blood_group && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>{errors.blood_group.message}</p>}
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>
                  Last Donation Date (Optional)
                </label>
                <input 
                  {...register('last_donation_date')} 
                  type="date" 
                  max={new Date().toISOString().split('T')[0]}
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem', 
                    fontSize: '1rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    boxSizing: 'border-box'
                  }}
                />
                <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.25rem 0 0' }}>
                  This helps us track your eligibility for future donations
                </p>
              </div>
            </>
          )}
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>
              Your Location *
            </label>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.75rem' }}>
              📍 We need your location to show you nearby blood drives
            </p>
            <button 
              type="button" 
              onClick={handleGetCurrentLocation} 
              disabled={locationStatus === 'fetching'}
              style={{ 
                width: '100%',
                padding: '0.75rem', 
                fontSize: '1rem', 
                backgroundColor: locationStatus === 'success' ? '#10b981' : '#667eea', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: locationStatus === 'fetching' ? 'not-allowed' : 'pointer',
                opacity: locationStatus === 'fetching' ? 0.6 : 1,
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {locationStatus === 'fetching' ? '📡 Getting Location...' : locationStatus === 'success' ? '✓ Location Captured' : '📍 Get Current Location'}
            </button>
            {errors.location && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Location is required</p>}
          </div>

          {submitError && (
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: '#fee2e2', 
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#991b1b',
              fontSize: '0.9rem'
            }}>
              {submitError}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting || locationStatus !== 'success'}
            style={{ 
              width: '100%',
              padding: '0.85rem', 
              fontSize: '1rem', 
              backgroundColor: '#667eea', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: (isSubmitting || locationStatus !== 'success') ? 'not-allowed' : 'pointer',
              opacity: (isSubmitting || locationStatus !== 'success') ? 0.6 : 1,
              marginTop: '0.5rem',
              fontWeight: 600
            }}
          >
            {isSubmitting ? 'Creating Profile...' : 'Complete Profile & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
};