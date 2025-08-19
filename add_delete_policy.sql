-- Add delete policy for service_requests table
-- Allow users to delete their own requests
-- Allow providers to delete requests they're involved with

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS service_requests_delete_scope ON public.service_requests;

-- Create new delete policy
CREATE POLICY service_requests_delete_scope ON public.service_requests
FOR DELETE TO authenticated
USING (
  -- Users can delete their own requests
  user_id = auth.uid() 
  OR 
  -- Providers can delete requests they're assigned to or have claimed
  provider_id = auth.uid() 
  OR 
  claimed_by = auth.uid()
);
