import { supabase } from './supabase';

export const cleanupExpiredClaims = async (): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_claims');
    
    if (error) {
      console.error('Error cleaning up expired claims:', error);
      return 0;
    }
    
    return data || 0;
  } catch (error) {
    console.error('Error cleaning up expired claims:', error);
    return 0;
  }
};

// Set up periodic cleanup (every 5 minutes)
export const startCleanupScheduler = () => {
  // Run cleanup every 5 minutes
  setInterval(async () => {
    const cleanedCount = await cleanupExpiredClaims();
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired claims`);
    }
  }, 5 * 60 * 1000); // 5 minutes
}; 