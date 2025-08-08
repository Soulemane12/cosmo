-- Fix Database Functions with SECURITY DEFINER
-- This ensures the functions can bypass RLS when updating service requests

-- 1. Drop existing functions
DROP FUNCTION IF EXISTS claim_service_request(uuid, uuid);
DROP FUNCTION IF EXISTS accept_claimed_request(uuid, uuid);
DROP FUNCTION IF EXISTS decline_claimed_request(uuid, uuid);

-- 2. Recreate functions with SECURITY DEFINER
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

-- 3. Create a cleanup function for expired claims
CREATE OR REPLACE FUNCTION cleanup_expired_claims()
RETURNS integer 
SECURITY DEFINER
AS $$
DECLARE
  affected_rows integer;
BEGIN
  UPDATE service_requests 
  SET 
    status = 'pending',
    provider_id = NULL,
    claimed_by = NULL,
    claimed_at = NULL,
    expires_at = NULL
  WHERE status = 'claimed' 
    AND expires_at < now();
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- 4. Grant execute permissions
GRANT EXECUTE ON FUNCTION claim_service_request(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_claimed_request(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_claimed_request(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_claims() TO authenticated;

-- 5. Create a scheduled job to clean up expired claims (optional)
-- This would need to be set up in Supabase dashboard or via cron
-- SELECT cron.schedule('cleanup-expired-claims', '*/5 * * * *', 'SELECT cleanup_expired_claims();'); 