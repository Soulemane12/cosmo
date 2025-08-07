"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, loginUser, registerUser, registerProvider, createCartForUser } from './store';
import { supabase } from '../lib/supabase';
import { signInUser } from '../lib/auth';

interface AuthContextType {
  currentUser: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser | null>;
  logout: () => void;
  registerNewUser: (name: string, email: string, password: string, location: string) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  registerNewProvider: (name: string, email: string, password: string, location: string, specialty: string) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from session)
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Get user details from our users table
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!error && user) {
            setCurrentUser({
              id: user.id,
              name: user.name,
              email: user.email,
              type: user.user_type
            });
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  const login = async (email: string, password: string): Promise<AuthUser | null> => {
    setIsLoading(true);
    try {
      const result = await signInUser(email, password);
      
      if (!result.success || !result.data) {
        return null;
      }

      const user = result.data.user;
      if (!user) {
        return null;
      }

      // Get user details from our users table
      let { data: userDetails, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      // If user doesn't exist in our table (e.g., after email confirmation), create their profile
      if (error || !userDetails) {
        // Get user metadata from auth
        const userMetadata = user.user_metadata;
        const userType = userMetadata?.user_type || 'user';
        const name = userMetadata?.name || user.email?.split('@')[0] || 'User';
        const location = userMetadata?.location || '';

        // Create user profile
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            name: name,
            email: user.email || '',
            location: location,
            user_type: userType
          })
          .select()
          .single();

        if (createError) {
          console.error('Failed to create user profile:', createError);
          return null;
        }

        userDetails = newUser;

        // If this is a provider, create their provider profile
        if (userType === 'provider') {
          const specialty = userMetadata?.specialty || '';
          await supabase
            .from('provider_profiles')
            .insert({
              user_id: user.id,
              specialty: specialty,
              rating: 0
            });
        }

        // Create cart for new user
        await createCartForUser(user.id);
      }

      const authUser = {
        id: user.id,
        name: userDetails.name,
        email: user.email || '',
        type: userDetails.user_type
      };

      setCurrentUser(authUser);
      return authUser;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const registerNewUser = async (
    name: string,
    email: string,
    password: string,
    location: string
  ): Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }> => {
    setIsLoading(true);
    try {
      const result = await registerUser({ name, email, location, user_type: 'user', password });
      
      if (result.success && result.user) {
        // Sign in the user after registration
        const loginResult = await signInUser(email, password);
        if (loginResult.success && loginResult.data) {
          setCurrentUser({
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            type: result.user.user_type
          });
        }
        return { success: true };
      }
      
      return { 
        success: false, 
        error: result.error || 'Failed to register user',
        requiresEmailConfirmation: result.requiresEmailConfirmation
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const registerNewProvider = async (
    name: string,
    email: string,
    password: string,
    location: string,
    specialty: string
  ): Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }> => {
    setIsLoading(true);
    try {
      const result = await registerProvider({ 
        name, 
        email, 
        location, 
        specialty,
        user_type: 'provider',
        password
      });
      
      if (result.success && result.provider) {
        // Sign in the provider after registration
        const loginResult = await signInUser(email, password);
        if (loginResult.success && loginResult.data) {
          setCurrentUser({
            id: result.provider.id,
            name: result.provider.name,
            email: result.provider.email,
            type: result.provider.user_type
          });
        }
        return { success: true };
      }
      
      return { 
        success: false, 
        error: result.error || 'Failed to register provider',
        requiresEmailConfirmation: result.requiresEmailConfirmation
      };
    } catch (error) {
      console.error('Provider registration error:', error);
      return { success: false, error: 'Provider registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        currentUser, 
        login, 
        logout, 
        registerNewUser,
        registerNewProvider,
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 