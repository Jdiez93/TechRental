-- Fix products RLS: allow anon (public) users to view products
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT TO public
  USING (true);

-- Allow anon to view bookings for availability checks
DROP POLICY IF EXISTS "Anyone can check availability" ON public.bookings;
CREATE POLICY "Anyone can check availability" ON public.bookings
  FOR SELECT TO public
  USING (true);

-- Create trigger to auto-insert notification on booking creation
CREATE OR REPLACE FUNCTION public.notify_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  product_name TEXT;
BEGIN
  SELECT name INTO product_name FROM public.products WHERE id = NEW.product_id;
  INSERT INTO public.notifications (user_id, title, message)
  VALUES (
    NEW.user_id,
    'Reserva confirmada',
    'Tu reserva de ' || COALESCE(product_name, 'equipo') || ' del ' || NEW.start_date || ' al ' || NEW.end_date || ' ha sido confirmada. Total: €' || NEW.total_price
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_created ON public.bookings;
CREATE TRIGGER on_booking_created
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_booking();