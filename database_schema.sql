-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- Create custom types
CREATE TYPE user_type AS ENUM ('user', 'provider');
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'declined', 'completed');

-- Users table (for both regular users and providers)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  user_type user_type NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table
CREATE TABLE services (
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
CREATE TABLE provider_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  specialty VARCHAR(255) NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping carts
CREATE TABLE carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart items
CREATE TABLE cart_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cart_id, service_id)
);

-- Service requests
CREATE TABLE service_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  status request_status NOT NULL DEFAULT 'pending',
  request_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_services_provider_id ON services(provider_id);
CREATE INDEX idx_service_requests_user_id ON service_requests(user_id);
CREATE INDEX idx_service_requests_provider_id ON service_requests(provider_id);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can create requests" ON service_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can update requests for their services" ON service_requests
  FOR UPDATE USING (auth.uid() = provider_id);

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

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