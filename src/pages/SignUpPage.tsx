import { useSignUp } from '@clerk/clerk-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema, type SignUpFormData } from '../lib/validation';
import { Link } from 'react-router-dom';

export const SignUpPage = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
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
        // 2. Use setValue from react-hook-form to update the form's state
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
      await signUp.create({
        emailAddress: data.email,
        password: data.password,
        unsafeMetadata: {
          name: data.name,
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
    }
  };

  const onPressVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({ code });
      
      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      console.error("Clerk Verification Error:", JSON.stringify(err, null, 2));
    }
  };

  if (pendingVerification) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Verify Your Email</h2>
        <form onSubmit={onPressVerify}>
          <input value={code} placeholder="Enter verification code..." onChange={(e) => setCode(e.target.value)} required />
          <button type="submit">Complete Sign Up</button>
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
        <input {...register('name')} type="text" placeholder="Full Name" />
        {errors.name && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.name.message}</p>}

        <input {...register('email')} type="email" placeholder="Email" />
        {errors.email && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.email.message}</p>}
        
        <input {...register('password')} type="password" placeholder="Password (min 8 characters)" />
        {errors.password && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.password.message}</p>}

        {/* Conditional Fields for Donors (This is where `role` is used) */}
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