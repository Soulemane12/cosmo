-- Migration script to add missing columns for the claiming system
-- Run this after the main schema if you have existing data

-- Add missing columns to service_requests table if they don't exist
DO $$ 
BEGIN
  -- Add claimed_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'service_requests' AND column_name = 'claimed_at') THEN
    ALTER TABLE service_requests ADD COLUMN claimed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Add claimed_by column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'service_requests' AND column_name = 'claimed_by') THEN
    ALTER TABLE service_requests ADD COLUMN claimed_by UUID REFERENCES users(id);
  END IF;
  
  -- Add expires_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'service_requests' AND column_name = 'expires_at') THEN
    ALTER TABLE service_requests ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Update status column type if it exists but is not the correct enum type
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'service_requests' AND column_name = 'status') THEN
    -- Check if the column is already the correct type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'service_requests' 
                   AND column_name = 'status' 
                   AND data_type = 'USER-DEFINED' 
                   AND udt_name = 'request_status') THEN
      -- Convert existing status values to new enum
      ALTER TABLE service_requests ALTER COLUMN status TYPE request_status 
        USING status::text::request_status;
    END IF;
  ELSE
    -- Add status column if it doesn't exist
    ALTER TABLE service_requests ADD COLUMN status request_status NOT NULL DEFAULT 'pending';
  END IF;
END $$;

-- Create missing indexes if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_service_requests_status') THEN
    CREATE INDEX idx_service_requests_status ON service_requests(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_service_requests_claimed_by') THEN
    CREATE INDEX idx_service_requests_claimed_by ON service_requests(claimed_by);
  END IF;
END $$;

-- Update any existing service_requests that don't have a status
UPDATE service_requests SET status = 'pending' WHERE status IS NULL;

-- Ensure all existing requests have the correct default values
UPDATE service_requests SET 
  claimed_at = NULL,
  claimed_by = NULL,
  expires_at = NULL
WHERE claimed_at IS NULL AND claimed_by IS NULL AND expires_at IS NULL; 