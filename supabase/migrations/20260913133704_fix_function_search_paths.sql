-- Fix mutable search_path on database functions
-- These functions need an explicit search_path to prevent search path injection

ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.increment_comment_count() SET search_path = public;
ALTER FUNCTION public.decrement_comment_count() SET search_path = public;
