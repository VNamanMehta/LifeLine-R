import { useSignIn } from '@clerk/clerk-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type SignInFormData = z.infer<typeof signInSchema>;

export const SignInPage = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    if (!isLoaded) return;

    setError('');
    try {
      const result = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        
        // Force navigation after session is set
        // Use setTimeout to ensure Clerk has updated the session state
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 100);
      } else {
        console.log('Sign in result:', result);
      }
    } catch (err: any) {
      console.error('Sign In Error:', err);
      setError(err.errors?.[0]?.longMessage || 'Invalid email or password');
    }
  };

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
        <h2 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#1f2937' }}>Welcome Back</h2>
        <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1.5rem' }}>
          Sign in to your LifeLine account
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
              placeholder="••••••••" 
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

          {error && (
            <div style={{ 
              padding: '0.75rem', 
              backgroundColor: '#fee2e2', 
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#991b1b',
              fontSize: '0.9rem'
            }}>
              {error}
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
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
          
          <p style={{ textAlign: 'center', fontSize: '0.9rem', margin: '1rem 0 0', color: '#6b7280' }}>
            Don't have an account? <Link to="/sign-up" style={{ color: '#667eea', textDecoration: 'none', fontWeight: 500 }}>Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};