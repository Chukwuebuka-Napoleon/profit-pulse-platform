
DROP POLICY "Anyone can insert notifications" ON public.admin_notifications;
CREATE POLICY "Authenticated users can insert notifications"
ON public.admin_notifications FOR INSERT
TO authenticated
WITH CHECK (true);
