# Supabase Setup Guide

## Database Schema

### 1. Create the user_type enum
```sql
CREATE TYPE public.user_type AS ENUM ('user', 'provider');
```

### 2. Create the users table (updated for Supabase auth)
```sql
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
) TABLESPACE pg_default;

-- Create index on email
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING btree (email) TABLESPACE pg_default;

-- Create trigger for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. Create the update_updated_at_column function
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### 4. Create provider_profiles table
```sql
CREATE TABLE public.provider_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  specialty character varying(255) NOT NULL,
  rating numeric(3,2) DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT provider_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT provider_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create trigger for updated_at
CREATE TRIGGER update_provider_profiles_updated_at BEFORE UPDATE ON provider_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 5. Create services table
```sql
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
) TABLESPACE pg_default;

-- Create trigger for updated_at
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 6. Create carts table
```sql
CREATE TABLE public.carts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT carts_pkey PRIMARY KEY (id),
  CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create trigger for updated_at
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 7. Create cart_items table
```sql
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
) TABLESPACE pg_default;

-- Create trigger for updated_at
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 8. Create service_requests table
```sql
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
) TABLESPACE pg_default;

-- Create trigger for updated_at
CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON service_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 9. Create notifications table
```sql
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
) TABLESPACE pg_default;
```

## Row Level Security (RLS) Policies

### Enable RLS on all tables
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

### Users table policies
```sql
-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### Provider profiles policies
```sql
-- Allow users to read all provider profiles
CREATE POLICY "Anyone can view provider profiles" ON provider_profiles
  FOR SELECT USING (true);

-- Allow providers to update their own profile
CREATE POLICY "Providers can update own profile" ON provider_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow providers to insert their own profile
CREATE POLICY "Providers can insert own profile" ON provider_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Services policies
```sql
-- Allow anyone to read services
CREATE POLICY "Anyone can view services" ON services
  FOR SELECT USING (true);

-- Allow providers to manage their own services
CREATE POLICY "Providers can manage own services" ON services
  FOR ALL USING (auth.uid() = provider_id);
```

### Carts policies
```sql
-- Allow users to manage their own cart
CREATE POLICY "Users can manage own cart" ON carts
  FOR ALL USING (auth.uid() = user_id);
```

### Cart items policies
```sql
-- Allow users to manage their own cart items
CREATE POLICY "Users can manage own cart items" ON cart_items
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM carts WHERE id = cart_id
  ));
```

### Service requests policies
```sql
-- Allow users to view their own requests
CREATE POLICY "Users can view own requests" ON service_requests
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to create requests
CREATE POLICY "Users can create requests" ON service_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow providers to view requests they're involved with
CREATE POLICY "Providers can view related requests" ON service_requests
  FOR SELECT USING (auth.uid() = provider_id OR auth.uid() = claimed_by);

-- Allow providers to update requests they're involved with
CREATE POLICY "Providers can update related requests" ON service_requests
  FOR UPDATE USING (auth.uid() = provider_id OR auth.uid() = claimed_by);
```

### Notifications policies
```sql
-- Allow users to view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to update their own notifications
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
```

## Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase Functions

### Claim service request function
```sql
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
```

### Accept claimed request function
```sql
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
```

### Decline claimed request function
```sql
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
``` 