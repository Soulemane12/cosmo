-- Fix Provider Request Visibility Issue
-- This script will debug and fix the issue where providers can't see their requests

-- 1. First, let's check what requests exist and their provider_id values
SELECT 
    sr.id,
    sr.user_id,
    sr.provider_id,
    sr.status,
    sr.request_date,
    u.name as user_name,
    p.name as provider_name
FROM service_requests sr
LEFT JOIN users u ON sr.user_id = u.id
LEFT JOIN users p ON sr.provider_id = p.id
ORDER BY sr.created_at DESC;

-- 2. Check if RLS is enabled and policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'service_requests';

-- 3. Drop and recreate the provider policies with better debugging
DROP POLICY IF EXISTS "Providers can view related requests" ON service_requests;
DROP POLICY IF EXISTS "Providers can update related requests" ON service_requests;

-- Create a more permissive policy for providers to see their requests
CREATE POLICY "Providers can view related requests" ON service_requests
  FOR SELECT USING (
    auth.uid() = provider_id 
    OR auth.uid() = claimed_by
    OR (
      provider_id IS NULL 
      AND status = 'pending'
      AND auth.uid() IN (SELECT id FROM users WHERE user_type = 'provider')
    )
  );

CREATE POLICY "Providers can update related requests" ON service_requests
  FOR UPDATE USING (
    auth.uid() = provider_id 
    OR auth.uid() = claimed_by
  );

-- 4. Add a policy for providers to insert claims
CREATE POLICY "Providers can claim requests" ON service_requests
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM users WHERE user_type = 'provider')
  );

-- 5. Grant explicit permissions
GRANT SELECT, UPDATE ON service_requests TO authenticated;

-- 6. Test the policy by checking what a provider should see
-- (Replace 'PROVIDER_UUID_HERE' with the actual provider UUID)
-- SELECT COUNT(*) FROM service_requests WHERE provider_id = 'PROVIDER_UUID_HERE';

-- 7. Show current user context (run this in Supabase SQL editor)
-- SELECT auth.uid() as current_user_id;

-- 8. Optional: Temporarily disable RLS for testing (comment out if not needed)
-- ALTER TABLE service_requests DISABLE ROW LEVEL SECURITY;
-- Then re-enable: ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY; 