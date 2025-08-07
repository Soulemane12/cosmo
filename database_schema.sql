-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- Drop existing types if they exist (for clean reinstall)
DROP TYPE IF EXISTS user_type CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- Create custom types
CREATE TYPE user_type AS ENUM ('user', 'provider');
CREATE TYPE request_status AS ENUM ('pending', 'claimed', 'accepted', 'declined', 'completed');
CREATE TYPE notification_type AS ENUM ('request_created', 'request_claimed', 'request_accepted', 'request_declined', 'request_completed');

-- Users table (for both regular users and providers)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  location VARCHAR(255) NOT NULL,
  user_type user_type NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  image_url VARCHAR(500),
  provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provider profiles (additional info for providers)
CREATE TABLE IF NOT EXISTS provider_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  specialty VARCHAR(255) NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping carts
CREATE TABLE IF NOT EXISTS carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart items
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cart_id, service_id)
);

-- Service requests (updated for first-come-first-served)
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  status request_status NOT NULL DEFAULT 'pending',
  request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  claimed_at TIMESTAMP WITH TIME ZONE,
  claimed_by UUID REFERENCES users(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing service_requests table if needed
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

-- Notifications table for real-time updates
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_users_email') THEN
    CREATE INDEX idx_users_email ON users(email);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_services_provider_id') THEN
    CREATE INDEX idx_services_provider_id ON services(provider_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_service_requests_user_id') THEN
    CREATE INDEX idx_service_requests_user_id ON service_requests(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_service_requests_provider_id') THEN
    CREATE INDEX idx_service_requests_provider_id ON service_requests(provider_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_service_requests_status') THEN
    CREATE INDEX idx_service_requests_status ON service_requests(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_service_requests_claimed_by') THEN
    CREATE INDEX idx_service_requests_claimed_by ON service_requests(claimed_by);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cart_items_cart_id') THEN
    CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_user_id') THEN
    CREATE INDEX idx_notifications_user_id ON notifications(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_is_read') THEN
    CREATE INDEX idx_notifications_is_read ON notifications(is_read);
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view provider profiles" ON users;
DROP POLICY IF EXISTS "Anyone can view services" ON services;
DROP POLICY IF EXISTS "Providers can create their own services" ON services;
DROP POLICY IF EXISTS "Providers can update their own services" ON services;
DROP POLICY IF EXISTS "Providers can delete their own services" ON services;
DROP POLICY IF EXISTS "Anyone can view provider profiles" ON provider_profiles;
DROP POLICY IF EXISTS "Providers can update their own profile" ON provider_profiles;
DROP POLICY IF EXISTS "Users can view their own cart" ON carts;
DROP POLICY IF EXISTS "Users can insert their own cart" ON carts;
DROP POLICY IF EXISTS "Users can view their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete their own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can view their own requests" ON service_requests;
DROP POLICY IF EXISTS "Providers can view requests for their services" ON service_requests;
DROP POLICY IF EXISTS "Providers can view unclaimed requests" ON service_requests;
DROP POLICY IF EXISTS "Users can create requests" ON service_requests;
DROP POLICY IF EXISTS "Providers can claim requests" ON service_requests;
DROP POLICY IF EXISTS "Providers can update claimed requests" ON service_requests;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view provider profiles" ON users
  FOR SELECT USING (user_type = 'provider');

-- RLS Policies for services
CREATE POLICY "Anyone can view services" ON services
  FOR SELECT USING (true);

CREATE POLICY "Providers can create their own services" ON services
  FOR INSERT WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update their own services" ON services
  FOR UPDATE USING (auth.uid() = provider_id);

CREATE POLICY "Providers can delete their own services" ON services
  FOR DELETE USING (auth.uid() = provider_id);

-- RLS Policies for provider_profiles
CREATE POLICY "Anyone can view provider profiles" ON provider_profiles
  FOR SELECT USING (true);

CREATE POLICY "Providers can update their own profile" ON provider_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for carts
CREATE POLICY "Users can view their own cart" ON carts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart" ON carts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for cart_items
CREATE POLICY "Users can view their own cart items" ON cart_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own cart items" ON cart_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own cart items" ON cart_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own cart items" ON cart_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM carts WHERE carts.id = cart_items.cart_id AND carts.user_id = auth.uid()
    )
  );

-- RLS Policies for service_requests
CREATE POLICY "Users can view their own requests" ON service_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Providers can view requests for their services" ON service_requests
  FOR SELECT USING (auth.uid() = provider_id);

CREATE POLICY "Providers can view unclaimed requests" ON service_requests
  FOR SELECT USING (status = 'pending' AND provider_id IS NULL);

CREATE POLICY "Users can create requests" ON service_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can claim requests" ON service_requests
  FOR UPDATE USING (auth.uid() = claimed_by AND status = 'pending');

CREATE POLICY "Providers can update claimed requests" ON service_requests
  FOR UPDATE USING (auth.uid() = claimed_by);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
DROP TRIGGER IF EXISTS update_provider_profiles_updated_at ON provider_profiles;
DROP TRIGGER IF EXISTS update_carts_updated_at ON carts;
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
DROP TRIGGER IF EXISTS update_service_requests_updated_at ON service_requests;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_profiles_updated_at BEFORE UPDATE ON provider_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to claim a service request (first-come-first-served)
CREATE OR REPLACE FUNCTION claim_service_request(
  request_id UUID,
  claiming_provider_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  request_exists BOOLEAN;
  already_claimed BOOLEAN;
BEGIN
  -- Check if request exists and is still pending
  SELECT EXISTS(
    SELECT 1 FROM service_requests 
    WHERE id = request_id 
    AND status = 'pending' 
    AND (claimed_by IS NULL OR claimed_by = claiming_provider_id)
  ) INTO request_exists;
  
  IF NOT request_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Try to claim the request
  UPDATE service_requests 
  SET 
    status = 'claimed',
    claimed_by = claiming_provider_id,
    claimed_at = NOW(),
    expires_at = NOW() + INTERVAL '5 minutes'
  WHERE id = request_id 
    AND status = 'pending' 
    AND (claimed_by IS NULL OR claimed_by = claiming_provider_id);
  
  -- Check if update was successful
  GET DIAGNOSTICS request_exists = ROW_COUNT;
  
  IF request_exists > 0 THEN
    -- Create notification for the user
    INSERT INTO notifications (user_id, type, title, message, related_request_id)
    SELECT 
      user_id,
      'request_claimed'::notification_type,
      'Service Request Claimed',
      'Your service request has been claimed by a provider. They have 5 minutes to accept or decline.',
      request_id
    FROM service_requests WHERE id = request_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to accept a claimed request
CREATE OR REPLACE FUNCTION accept_claimed_request(
  request_id UUID,
  provider_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  request_exists BOOLEAN;
BEGIN
  -- Check if request is claimed by this provider and not expired
  SELECT EXISTS(
    SELECT 1 FROM service_requests 
    WHERE id = request_id 
    AND status = 'claimed' 
    AND claimed_by = provider_id
    AND expires_at > NOW()
  ) INTO request_exists;
  
  IF NOT request_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Accept the request
  UPDATE service_requests 
  SET 
    status = 'accepted',
    provider_id = provider_id
  WHERE id = request_id 
    AND status = 'claimed' 
    AND claimed_by = provider_id
    AND expires_at > NOW();
  
  -- Check if update was successful
  GET DIAGNOSTICS request_exists = ROW_COUNT;
  
  IF request_exists > 0 THEN
    -- Create notification for the user
    INSERT INTO notifications (user_id, type, title, message, related_request_id)
    SELECT 
      user_id,
      'request_accepted'::notification_type,
      'Service Request Accepted',
      'Your service request has been accepted by a provider.',
      request_id
    FROM service_requests WHERE id = request_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to decline a claimed request
CREATE OR REPLACE FUNCTION decline_claimed_request(
  request_id UUID,
  provider_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  request_exists BOOLEAN;
BEGIN
  -- Check if request is claimed by this provider
  SELECT EXISTS(
    SELECT 1 FROM service_requests 
    WHERE id = request_id 
    AND status = 'claimed' 
    AND claimed_by = provider_id
  ) INTO request_exists;
  
  IF NOT request_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Reset the request to pending
  UPDATE service_requests 
  SET 
    status = 'pending',
    claimed_by = NULL,
    claimed_at = NULL,
    expires_at = NULL
  WHERE id = request_id 
    AND status = 'claimed' 
    AND claimed_by = provider_id;
  
  -- Check if update was successful
  GET DIAGNOSTICS request_exists = ROW_COUNT;
  
  IF request_exists > 0 THEN
    -- Create notification for the user
    INSERT INTO notifications (user_id, type, title, message, related_request_id)
    SELECT 
      user_id,
      'request_declined'::notification_type,
      'Service Request Declined',
      'A provider has declined your service request. It is now available for other providers.',
      request_id
    FROM service_requests WHERE id = request_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired claims (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_claims()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  -- Reset expired claims back to pending
  UPDATE service_requests 
  SET 
    status = 'pending',
    claimed_by = NULL,
    claimed_at = NULL,
    expires_at = NULL
  WHERE status = 'claimed' 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  
  -- Create notifications for expired claims
  INSERT INTO notifications (user_id, type, title, message, related_request_id)
  SELECT 
    user_id,
    'request_declined'::notification_type,
    'Service Request Expired',
    'A provider did not respond to your service request in time. It is now available for other providers.',
    id
  FROM service_requests 
  WHERE status = 'pending' 
    AND claimed_by IS NULL
    AND id IN (
      SELECT id FROM service_requests 
      WHERE status = 'claimed' 
        AND expires_at < NOW()
    );
  
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql; 