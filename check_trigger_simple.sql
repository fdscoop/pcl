SELECT COUNT(*) as trigger_exists 
FROM pg_trigger 
WHERE tgname = 'trigger_create_pending_payout_summaries';
