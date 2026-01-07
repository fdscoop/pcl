-- Enable Realtime for stadium_slots table
-- This allows real-time notifications for booking updates

-- Enable realtime for the stadium_slots table
ALTER PUBLICATION supabase_realtime ADD TABLE stadium_slots;

-- Optional: If you want to enable realtime for specific columns only
-- ALTER PUBLICATION supabase_realtime ADD TABLE stadium_slots (
--   id, stadium_id, slot_date, start_time, end_time, is_available, booked_by, booking_date
-- );

-- Note: You may also need to enable this in Supabase Dashboard:
-- Database > Replication > Enable replication for stadium_slots table
