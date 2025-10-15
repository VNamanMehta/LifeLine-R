import { useSignUp } from '@clerk/clerk-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpFormData } from '../lib/validation';
import { Link, useNavigate } from 'react-router-dom';

export const SignUpPage = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      role: 'donor',
    }
  });

  const role = watch('role');

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
      () => {
        setLocationStatus('error');
        alert('Unable to retrieve your location. Please ensure location access is enabled.');
      }
    );
  };

  const onSubmit = async (data: SignUpFormData) => {
    if (!isLoaded) return;

    try {
      // Combine first and last name for the name field
      const fullName = `${data.firstName} ${data.lastName}`.trim();

      await signUp.create({
        emailAddress: data.email,
        password: data.password,
        unsafeMetadata: {
          name: fullName,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          blood_group: data.role === 'donor' ? data.blood_group : undefined,
          location: data.location,
          last_donation_date: data.last_donation_date || undefined,
        },
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      console.error("Clerk Sign Up Error:", JSON.stringify(err, null, 2));
      alert(`Sign up failed: ${err.errors?.[0]?.longMessage || err.message || 'Unknown error'}`);
    }
  };

  const onPressVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || isVerifying) return;

    setIsVerifying(true);
    setVerificationError('');

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      
      if (completeSignUp.status === 'complete') {
        // Set the active session
        await setActive({ session: completeSignUp.createdSessionId });
        
        // Give the webhook a moment to process (optional but recommended)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Navigate using React Router
        navigate('/dashboard', { replace: true });
      } else {
        // Handle other statuses
        console.log('Sign up status:', completeSignUp.status);
        setVerificationError('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error("Clerk Verification Error:", JSON.stringify(err, null, 2));
      
      // Handle the specific "already verified" error
      if (err.errors?.[0]?.code === 'verification_already_verified') {
        // Try to set active session and navigate
        try {
          if (signUp.createdSessionId) {
            await setActive({ session: signUp.createdSessionId });
            navigate('/dashboard', { replace: true });
            return;
          }
        } catch (navErr) {
          console.error('Navigation error:', navErr);
        }
        setVerificationError('This email has already been verified. Try signing in instead.');
      } else {
        setVerificationError(err.errors?.[0]?.longMessage || 'Verification failed. Please check your code.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  if (pendingVerification) {
    return (
      <div style={{ padding: '2rem', maxWidth: '400px', margin: 'auto' }}>
        <h2>Verify Your Email</h2>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
          We've sent a verification code to your email. Please enter it below.
        </p>
        <form onSubmit={onPressVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            value={code} 
            placeholder="Enter verification code..." 
            onChange={(e) => setCode(e.target.value)} 
            required 
            style={{ padding: '0.5rem', fontSize: '1rem' }}
            disabled={isVerifying}
          />
          {verificationError && (
            <p style={{ color: 'red', fontSize: '0.9rem' }}>{verificationError}</p>
          )}
          <button type="submit" disabled={isVerifying || !code}>
            {isVerifying ? 'Verifying...' : 'Complete Sign Up'}
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            Already verified? <Link to="/sign-in" style={{ color: 'blue' }}>Sign In</Link>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: 'auto' }}>
      <h2>Create Your Account</h2>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Role Selection */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <label>
            <input type="radio" {...register('role')} value="donor" /> I am a Donor
          </label>
          <label>
            <input type="radio" {...register('role')} value="staff" /> I am Blood Bank Staff
          </label>
        </div>
        <hr />
        
        {/* Standard Inputs */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <input {...register('firstName')} type="text" placeholder="First Name" />
            {errors.firstName && <p style={{ color: 'red' }}>{errors.firstName.message}</p>}
          </div>
          <div style={{ flex: 1 }}>
            <input {...register('lastName')} type="text" placeholder="Last Name" />
            {errors.lastName && <p style={{ color: 'red' }}>{errors.lastName.message}</p>}
          </div>
        </div>

        <input {...register('email')} type="email" placeholder="Email" />
        {errors.email && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.email.message}</p>}
        
        <input {...register('password')} type="password" placeholder="Password (min 8 characters)" />
        {errors.password && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.password.message}</p>}

        {/* Conditional Fields for Donors */}
        {role === 'donor' && (
          <>
            <select {...register('blood_group')}>
              <option value="">Select Blood Group...</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
            {errors.blood_group && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.blood_group.message}</p>}
            
            <label>
              Last Donation Date (optional):
              <input {...register('last_donation_date')} type="date" />
            </label>
          </>
        )}
        
        {/* Location Input Section */}
        <div>
          <label>Your Location:</label>
          <button type="button" onClick={handleGetCurrentLocation} disabled={locationStatus === 'fetching'}>
            {locationStatus === 'fetching' ? 'Getting Location...' : 'Get Current Location'}
          </button>
          {locationStatus === 'success' && <p style={{ color: 'green', fontSize: '0.8rem' }}>✓ Location captured!</p>}
          {errors.location && <p style={{ color: 'red', fontSize: '0.8rem' }}>A valid location is required.</p>}
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing Up...' : 'Sign Up'}
        </button>
        <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/sign-in" style={{ color: 'blue' }}>Sign In</Link>
        </p>
      </form>
    </div>
  );
};