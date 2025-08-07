import { supabase } from './supabase';

// Use Supabase's built-in authentication with proper password handling
export const signUpUser = async (email: string, password: string, userData: {
  name: string;
  location: string;
  user_type: 'user' | 'provider';
}) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: userData.name,
          location: userData.location,
          user_type: userData.user_type
        }
      }
    });

    if (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

export const signInUser = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

export const signOutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Get user error:', error);
      return null;
    }
    return user;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
};

// Legacy functions for backward compatibility (deprecated)
export const hashPassword = async (password: string): Promise<string> => {
  console.warn('hashPassword is deprecated. Use Supabase auth instead.');
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  console.warn('verifyPassword is deprecated. Use Supabase auth instead.');
  const hashedInput = await hashPassword(password);
  return hashedInput === hashedPassword;
}; 