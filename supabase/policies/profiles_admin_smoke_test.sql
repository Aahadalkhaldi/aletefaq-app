-- Run after applying migration 20260411170000_profiles_admin_hardening.sql
-- Expectation: non-admin updates to role/status/rejection_reason fail, admin updates succeed.

-- 1) As a non-admin session, this must fail:
-- update public.profiles set role = 'admin' where id = auth.uid();

-- 2) As a non-admin session, this should still succeed for safe self-service fields:
-- update public.profiles set phone = '+97400000000' where id = auth.uid();

-- 3) As an approved admin session, this should succeed:
-- update public.profiles set status = 'approved' where id = '<target-user-id>';
