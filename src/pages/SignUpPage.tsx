import { useSignUp } from '@clerk/clerk-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export const SignUpPage = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const navigate = useNavigate();
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [signUpError, setSignUpError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    if (!isLoaded) return;

    setSignUpError('');
    try {
      await signUp.create({
        emailAddress: data.email,
        password: data.password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      console.error('Sign Up Error:', err);
      setSignUpError(err.errors?.[0]?.longMessage || 'Sign up failed. Please try again.');
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
        await setActive({ session: completeSignUp.createdSessionId });
        navigate('/complete-profile', { replace: true });
      } else {
        setVerificationError('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error('Verification Error:', err);
      
      if (err.errors?.[0]?.code === 'verification_already_verified') {
        if (signUp.createdSessionId) {
          await setActive({ session: signUp.createdSessionId });
          navigate('/complete-profile', { replace: true });
          return;
        }
        setVerificationError('Already verified. Try signing in instead.');
      } else if (err.errors?.[0]?.code === 'form_code_incorrect') {
        setVerificationError('Incorrect code. Please try again.');
      } else if (err.errors?.[0]?.code === 'verification_expired') {
        setVerificationError('Code expired. Request a new one.');
      } else {
        setVerificationError(err.errors?.[0]?.longMessage || 'Verification failed.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const resendCode = async () => {
    if (!isLoaded) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      alert('New code sent to your email!');
      setVerificationError('');
    } catch (err) {
      alert('Failed to resend code.');
    }
  };

  if (pendingVerification) {
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
          maxWidth: '400px', 
          backgroundColor: 'white', 
          padding: '2rem', 
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#1f2937' }}>Verify Your Email</h2>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1.5rem' }}>
            We've sent a 6-digit code to your email. Please enter it below.
          </p>
          
          <form onSubmit={onPressVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              value={code} 
              placeholder="Enter 6-digit code" 
              onChange={(e) => setCode(e.target.value)} 
              required 
              style={{ 
                width: '100%',
                padding: '0.75rem', 
                fontSize: '1.2rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                textAlign: 'center',
                letterSpacing: '0.5rem',
                boxSizing: 'border-box'
              }}
              disabled={isVerifying}
              autoFocus
              maxLength={6}
            />
            
            {verificationError && (
              <div style={{ 
                padding: '0.75rem', 
                backgroundColor: '#fee2e2', 
                border: '1px solid #fecaca',
                borderRadius: '6px',
                color: '#991b1b',
                fontSize: '0.9rem'
              }}>
                {verificationError}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isVerifying || !code || code.length !== 6}
              style={{ 
                width: '100%',
                padding: '0.75rem', 
                fontSize: '1rem', 
                backgroundColor: '#667eea', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: (isVerifying || !code || code.length !== 6) ? 'not-allowed' : 'pointer',
                opacity: (isVerifying || !code || code.length !== 6) ? 0.6 : 1,
                fontWeight: 600
              }}
            >
              {isVerifying ? 'Verifying...' : 'Verify Email'}
            </button>
            
            <button 
              type="button" 
              onClick={resendCode}
              style={{ 
                width: '100%',
                padding: '0.75rem',
                background: 'transparent', 
                color: '#667eea', 
                border: '1px solid #667eea',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Resend Code
            </button>
            
            <p style={{ textAlign: 'center', fontSize: '0.9rem', margin: '0.5rem 0 0', color: '#6b7280' }}>
              Already have an account? <Link to="/sign-in" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
            </p>
          </form>
        </div>
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
        maxWidth: '400px', 
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#1f2937' }}>Create Your Account</h2>
        <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1.5rem' }}>
          Join LifeLine and start saving lives
        </p>
        
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>
              Email
            </label>
            <input 
              {...register('email')} 
              type="email" 
              placeholder="your@email.com" 
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                fontSize: '1rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                boxSizing: 'border-box'
              }}
            />
            {errors.email && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>{errors.email.message}</p>}
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 500, color: '#374151' }}>
              Password
            </label>
            <input 
              {...register('password')} 
              type="password" 
              placeholder="Min 8 characters" 
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                fontSize: '1rem', 
                border: '1px solid #d1d5db', 
                borderRadius: '6px',
                boxSizing: 'border-box'
              }}
            />
            {errors.password && <p style={{ color: '#ef4444', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>{errors.password.message}</p>}
          </div>

          {signUpError && (
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: '#fee2e2', 
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#991b1b',
              fontSize: '0.9rem'
            }}>
              {signUpError}
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{ 
              width: '100%',
              padding: '0.75rem', 
              fontSize: '1rem', 
              backgroundColor: '#667eea', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.6 : 1,
              marginTop: '0.5rem',
              fontWeight: 600
            }}
          >
            {isSubmitting ? 'Creating Account...' : 'Sign Up'}
          </button>
          
          <p style={{ textAlign: 'center', fontSize: '0.9rem', margin: '1rem 0 0', color: '#6b7280' }}>
            Already have an account? <Link to="/sign-in" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
};