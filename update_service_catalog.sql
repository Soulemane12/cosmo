-- Remove all existing services and add only the three specified ones
-- First, delete all existing services
DELETE FROM public.service_catalog;

-- Insert the three new services
INSERT INTO public.service_catalog (category, name, description, default_price, sort_order, is_active) 
VALUES 
  ('Injectables', 'Filler', 'Appointment duration: 30-40mins', 900, 10, true),
  ('IV Therapy', 'IV Therapy', 'Appointment duration: 30-40 mins. There are two IV treatments: Immunity Boost and Inner Beauty', 350, 20, true),
  ('Injectables', 'Neurotoxin', 'Appointment duration: varies by treatment area', 20, 30, true);
