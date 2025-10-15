import { useSignIn } from '@clerk/clerk-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, type SignInFormData } from '../lib/validation';
import { Link, useNavigate } from 'react-router-dom';

export const SignInPage = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    if (!isLoaded) return;

    try {
      const result = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (result.status === 'complete') {
        // Set the active session and redirect
        await setActive({ session: result.createdSessionId });
        navigate('/dashboard');
      } else {
        // Handle other cases like 2FA if you enable it
        console.log(result);
      }
    } catch (err: any) {
      console.error("Clerk Sign In Error:", JSON.stringify(err, null, 2));
      // You can add state to show an error message to the user here
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: 'auto' }}>
      <h2>Sign In to Your Account</h2>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <input {...register('email')} type="email" placeholder="Email" />
        {errors.email && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.email.message}</p>}
        
        <input {...register('password')} type="password" placeholder="Password" />
        {errors.password && <p style={{ color: 'red', fontSize: '0.8rem' }}>{errors.password.message}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>
          Don't have an account? <Link to="/sign-up" style={{ color: 'blue' }}>Sign Up</Link>
        </p>
      </form>
    </div>
  );
};