-- ═══════════════════════════════════════════════════════
-- TANDEM TEST USERS — PAIRING SCRIPT
-- Run ONCE, after both test accounts have signed up via the
-- app and completed onboarding.
--
-- Test accounts (Gmail plus-addressing, both land in Kerwin's inbox):
--   Test Kerwin: kerwinferrette+test@gmail.com
--   Test Dani:   kerwinferrette+testdani@gmail.com
--
-- Safety: keyed strictly to the +test emails. Cannot touch
-- kerwinferrette@gmail.com or dgaumer03@gmail.com.
-- ═══════════════════════════════════════════════════════

DO $$
DECLARE
  tk uuid;  -- test kerwin
  td uuid;  -- test dani
BEGIN
  SELECT id INTO tk FROM users WHERE email = 'kerwinferrette+test@gmail.com';
  SELECT id INTO td FROM users WHERE email = 'kerwinferrette+testdani@gmail.com';

  IF tk IS NULL OR td IS NULL THEN
    RAISE EXCEPTION 'Both test users must sign up and complete onboarding first. Found tk=%, td=%', tk, td;
  END IF;

  UPDATE users SET partner_id = td WHERE id = tk;
  UPDATE users SET partner_id = tk WHERE id = td;

  RAISE NOTICE 'Paired test users: % <-> %', tk, td;
END $$;

-- Verify:
SELECT id, name, email, partner_id
FROM users
WHERE email LIKE 'kerwinferrette+test%';
