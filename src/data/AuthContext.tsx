"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, loginUser, registerUser, registerProvider } from './store';
import { supabase } from '../lib/supabase';
import { signInUser } from '../lib/auth';

interface AuthContextType {
  currentUser: AuthUser | null;
  login: (email: string, password: string) => Promise<AuthUser | null>;
  logout: () => void;
  registerNewUser: (name: string, email: string, password: string, location: string) => Promise<boolean>;
  registerNewProvider: (name: string, email: string, password: string, location: string, specialty: string) => Promise<boolean>;
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
      const { data: userDetails, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !userDetails) {
        return null;
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
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const user = await registerUser({ name, email, location, user_type: 'user', password });
      if (user) {
        // Sign in the user after registration
        const loginResult = await signInUser(email, password);
        if (loginResult.success && loginResult.data) {
          setCurrentUser({
            id: user.id,
            name: user.name,
            email: user.email,
            type: user.user_type
          });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
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
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const provider = await registerProvider({ 
        name, 
        email, 
        location, 
        specialty,
        user_type: 'provider',
        password
      });
      if (provider) {
        // Sign in the provider after registration
        const loginResult = await signInUser(email, password);
        if (loginResult.success && loginResult.data) {
          setCurrentUser({
            id: provider.id,
            name: provider.name,
            email: provider.email,
            type: provider.user_type
          });
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Provider registration error:', error);
      return false;
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