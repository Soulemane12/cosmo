-- Check and Setup Database Script
-- This script checks what exists and adds only missing components

-- 1. Check if user_type enum exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type') THEN
        CREATE TYPE public.user_type AS ENUM ('user', 'provider');
        RAISE NOTICE 'Created user_type enum';
    ELSE
        RAISE NOTICE 'user_type enum already exists';
    END IF;
END $$;

-- 2. Check if update_updated_at_column function exists, create if not
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Check if users table exists and has correct structure
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Create users table
        CREATE TABLE public.users (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            name character varying(255) NOT NULL,
            email character varying(255) NOT NULL,
            location character varying(255) NOT NULL,
            user_type public.user_type NOT NULL DEFAULT 'user'::user_type,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            CONSTRAINT users_pkey PRIMARY KEY (id),
            CONSTRAINT users_email_key UNIQUE (email)
        );
        
        -- Create index
        CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING btree (email);
        
        -- Create trigger
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        RAISE NOTICE 'Created users table';
    ELSE
        -- Check if password_hash column exists and remove it if it does
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') THEN
            ALTER TABLE public.users DROP COLUMN password_hash;
            RAISE NOTICE 'Removed password_hash column from users table';
        END IF;
        
        -- Check if required columns exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'location') THEN
            ALTER TABLE public.users ADD COLUMN location character varying(255) NOT NULL DEFAULT '';
            RAISE NOTICE 'Added location column to users table';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_type') THEN
            ALTER TABLE public.users ADD COLUMN user_type public.user_type NOT NULL DEFAULT 'user'::user_type;
            RAISE NOTICE 'Added user_type column to users table';
        END IF;
        
        RAISE NOTICE 'Users table already exists, updated structure';
    END IF;
END $$;

-- 4. Check if provider_profiles table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_profiles') THEN
        CREATE TABLE public.provider_profiles (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL,
            specialty character varying(255) NOT NULL,
            rating numeric(3,2) DEFAULT 0,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            CONSTRAINT provider_profiles_pkey PRIMARY KEY (id),
            CONSTRAINT provider_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        CREATE TRIGGER update_provider_profiles_updated_at BEFORE UPDATE ON provider_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        RAISE NOTICE 'Created provider_profiles table';
    ELSE
        RAISE NOTICE 'provider_profiles table already exists';
    END IF;
END $$;

-- 5. Check if services table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
        CREATE TABLE public.services (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            name character varying(255) NOT NULL,
            description text,
            price numeric(10,2) NOT NULL,
            category character varying(255) NOT NULL,
            image_url text,
            provider_id uuid NOT NULL,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            CONSTRAINT services_pkey PRIMARY KEY (id),
            CONSTRAINT services_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        RAISE NOTICE 'Created services table';
    ELSE
        RAISE NOTICE 'services table already exists';
    END IF;
END $$;

-- 6. Check if carts table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'carts') THEN
        CREATE TABLE public.carts (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            CONSTRAINT carts_pkey PRIMARY KEY (id),
            CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        RAISE NOTICE 'Created carts table';
    ELSE
        RAISE NOTICE 'carts table already exists';
    END IF;
END $$;

-- 7. Check if cart_items table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cart_items') THEN
        CREATE TABLE public.cart_items (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            cart_id uuid NOT NULL,
            service_id uuid NOT NULL,
            provider_id uuid NOT NULL,
            quantity integer NOT NULL DEFAULT 1,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            CONSTRAINT cart_items_pkey PRIMARY KEY (id),
            CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
            CONSTRAINT cart_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
            CONSTRAINT cart_items_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE
        );
        
        CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        RAISE NOTICE 'Created cart_items table';
    ELSE
        RAISE NOTICE 'cart_items table already exists';
    END IF;
END $$;

-- 8. Check if service_requests table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_requests') THEN
        CREATE TABLE public.service_requests (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL,
            provider_id uuid,
            service_id uuid NOT NULL,
            status character varying(50) NOT NULL DEFAULT 'pending',
            request_date timestamp with time zone DEFAULT now(),
            scheduled_date timestamp with time zone,
            notes text,
            claimed_at timestamp with time zone,
            claimed_by uuid,
            expires_at timestamp with time zone,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            CONSTRAINT service_requests_pkey PRIMARY KEY (id),
            CONSTRAINT service_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT service_requests_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE SET NULL,
            CONSTRAINT service_requests_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
            CONSTRAINT service_requests_claimed_by_fkey FOREIGN KEY (claimed_by) REFERENCES users(id) ON DELETE SET NULL
        );
        
        CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON service_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        
        RAISE NOTICE 'Created service_requests table';
    ELSE
        RAISE NOTICE 'service_requests table already exists';
    END IF;
END $$;

-- 9. Check if notifications table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE TABLE public.notifications (
            id uuid NOT NULL DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL,
            type character varying(50) NOT NULL,
            title character varying(255) NOT NULL,
            message text NOT NULL,
            related_request_id uuid,
            is_read boolean DEFAULT false,
            created_at timestamp with time zone DEFAULT now(),
            CONSTRAINT notifications_pkey PRIMARY KEY (id),
            CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT notifications_related_request_id_fkey FOREIGN KEY (related_request_id) REFERENCES service_requests(id) ON DELETE CASCADE
        );
        
        RAISE NOTICE 'Created notifications table';
    ELSE
        RAISE NOTICE 'notifications table already exists';
    END IF;
END $$;

-- 10. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Provider profiles policies
DROP POLICY IF EXISTS "Anyone can view provider profiles" ON provider_profiles;
DROP POLICY IF EXISTS "Providers can update own profile" ON provider_profiles;
DROP POLICY IF EXISTS "Providers can insert own profile" ON provider_profiles;

CREATE POLICY "Anyone can view provider profiles" ON provider_profiles
  FOR SELECT USING (true);

CREATE POLICY "Providers can update own profile" ON provider_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Providers can insert own profile" ON provider_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Services policies
DROP POLICY IF EXISTS "Anyone can view services" ON services;
DROP POLICY IF EXISTS "Providers can manage own services" ON services;

CREATE POLICY "Anyone can view services" ON services
  FOR SELECT USING (true);

CREATE POLICY "Providers can manage own services" ON services
  FOR ALL USING (auth.uid() = provider_id);

-- Carts policies
DROP POLICY IF EXISTS "Users can manage own cart" ON carts;

CREATE POLICY "Users can manage own cart" ON carts
  FOR ALL USING (auth.uid() = user_id);

-- Cart items policies
DROP POLICY IF EXISTS "Users can manage own cart items" ON cart_items;

CREATE POLICY "Users can manage own cart items" ON cart_items
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM carts WHERE id = cart_id
  ));

-- Service requests policies
DROP POLICY IF EXISTS "Users can view own requests" ON service_requests;
DROP POLICY IF EXISTS "Users can create requests" ON service_requests;
DROP POLICY IF EXISTS "Providers can view related requests" ON service_requests;
DROP POLICY IF EXISTS "Providers can update related requests" ON service_requests;

CREATE POLICY "Users can view own requests" ON service_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create requests" ON service_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can view related requests" ON service_requests
  FOR SELECT USING (auth.uid() = provider_id OR auth.uid() = claimed_by);

CREATE POLICY "Providers can update related requests" ON service_requests
  FOR UPDATE USING (auth.uid() = provider_id OR auth.uid() = claimed_by);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 12. Create functions if they don't exist
CREATE OR REPLACE FUNCTION claim_service_request(request_id uuid, claiming_provider_id uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE service_requests 
  SET 
    status = 'claimed',
    provider_id = claiming_provider_id,
    claimed_by = claiming_provider_id,
    claimed_at = now()
  WHERE id = request_id 
    AND status = 'pending'
    AND provider_id IS NULL;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION accept_claimed_request(request_id uuid, provider_id uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE service_requests 
  SET status = 'accepted'
  WHERE id = request_id 
    AND status = 'claimed'
    AND claimed_by = provider_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decline_claimed_request(request_id uuid, provider_id uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE service_requests 
  SET 
    status = 'pending',
    provider_id = NULL,
    claimed_by = NULL,
    claimed_at = NULL
  WHERE id = request_id 
    AND status = 'claimed'
    AND claimed_by = provider_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 13. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 14. Final check - show what tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('users', 'provider_profiles', 'services', 'carts', 'cart_items', 'service_requests', 'notifications') 
        THEN '✓ Required table exists'
        ELSE '⚠ Unexpected table'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name; 