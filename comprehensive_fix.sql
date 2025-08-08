-- Comprehensive Fix for Provider Request Visibility
-- Run this in your Supabase SQL editor

-- 1. First, let's see what we're working with
SELECT 'Current service_requests data:' as info;
SELECT 
    id,
    user_id,
    provider_id,
    status,
    created_at,
    CASE 
        WHEN provider_id IS NOT NULL THEN 'Has provider'
        ELSE 'No provider'
    END as assignment
FROM service_requests 
ORDER BY created_at DESC;

-- 2. Check current RLS policies
SELECT 'Current RLS policies:' as info;
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'service_requests';

-- 3. Drop all existing policies and recreate them properly
DROP POLICY IF EXISTS "Users can view own requests" ON service_requests;
DROP POLICY IF EXISTS "Users can create requests" ON service_requests;
DROP POLICY IF EXISTS "Providers can view related requests" ON service_requests;
DROP POLICY IF EXISTS "Providers can update related requests" ON service_requests;
DROP POLICY IF EXISTS "Providers can claim requests" ON service_requests;

-- 4. Create comprehensive policies
-- Users can see their own requests
CREATE POLICY "Users can view own requests" ON service_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create requests
CREATE POLICY "Users can create requests" ON service_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Providers can see requests assigned to them OR they claimed OR unassigned pending requests
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

-- Providers can update requests they're assigned to or claimed
CREATE POLICY "Providers can update related requests" ON service_requests
  FOR UPDATE USING (
    auth.uid() = provider_id 
    OR auth.uid() = claimed_by
  );

-- 5. Fix the database functions with SECURITY DEFINER
DROP FUNCTION IF EXISTS claim_service_request(uuid, uuid);
DROP FUNCTION IF EXISTS accept_claimed_request(uuid, uuid);
DROP FUNCTION IF EXISTS decline_claimed_request(uuid, uuid);

CREATE OR REPLACE FUNCTION claim_service_request(request_id uuid, claiming_provider_id uuid)
RETURNS boolean 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE service_requests 
  SET 
    status = 'claimed',
    provider_id = claiming_provider_id,
    claimed_by = claiming_provider_id,
    claimed_at = now(),
    expires_at = now() + interval '5 minutes'
  WHERE id = request_id 
    AND status = 'pending'
    AND provider_id IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION accept_claimed_request(request_id uuid, provider_id uuid)
RETURNS boolean 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE service_requests 
  SET status = 'accepted'
  WHERE id = request_id 
    AND status = 'claimed'
    AND claimed_by = provider_id
    AND expires_at > now();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decline_claimed_request(request_id uuid, provider_id uuid)
RETURNS boolean 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE service_requests 
  SET 
    status = 'pending',
    provider_id = NULL,
    claimed_by = NULL,
    claimed_at = NULL,
    expires_at = NULL
  WHERE id = request_id 
    AND status = 'claimed'
    AND claimed_by = provider_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 6. Grant all necessary permissions
GRANT SELECT, INSERT, UPDATE ON service_requests TO authenticated;
GRANT EXECUTE ON FUNCTION claim_service_request(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_claimed_request(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_claimed_request(uuid, uuid) TO authenticated;

-- 7. Test the fix by checking what a provider should see
-- (Replace 'YOUR_PROVIDER_UUID' with Billy Duc's actual UUID)
SELECT 'Testing provider visibility - replace UUID below:' as info;
-- SELECT COUNT(*) as total_requests FROM service_requests WHERE provider_id = 'YOUR_PROVIDER_UUID';
-- SELECT COUNT(*) as pending_requests FROM service_requests WHERE provider_id = 'YOUR_PROVIDER_UUID' AND status = 'pending';
-- SELECT COUNT(*) as accepted_requests FROM service_requests WHERE provider_id = 'YOUR_PROVIDER_UUID' AND status = 'accepted';

-- 8. Optional: If still not working, temporarily disable RLS for testing
-- ALTER TABLE service_requests DISABLE ROW LEVEL SECURITY;
-- Then check: SELECT COUNT(*) FROM service_requests WHERE provider_id IS NOT NULL;
-- Re-enable: ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- 9. Show final policy status
SELECT 'Final RLS policies:' as info;
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'service_requests'; 