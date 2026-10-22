-- Multi-vault ownership fixes.
--
-- 1. collections.owner_id can no longer be unique: a user may own several
--    vaults (their own plus one transferred to them), and someone who left
--    the vault they created must be able to create a fresh personal one.
--    owner_id is now creator-provenance only; authorization lives in
--    collection_members.
ALTER TABLE "public"."collections"
  DROP CONSTRAINT "collections_owner_id_key";

-- 2. Leaving a vault atomically: locks the vault's membership rows so two
--    owners can't depart at once and strand the vault, promotes the chosen
--    successor when the sole owner leaves, then removes the leaver's row.
CREATE OR REPLACE FUNCTION public.leave_collection(
  p_collection_id uuid,
  p_user_id       text,
  p_successor_id  text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_my_role      text;
  v_member_count int;
  v_other_owners int;
BEGIN
  PERFORM 1 FROM public.collection_members
    WHERE collection_id = p_collection_id
    FOR UPDATE;

  SELECT role INTO v_my_role FROM public.collection_members
    WHERE collection_id = p_collection_id AND user_id = p_user_id;
  IF v_my_role IS NULL THEN
    RAISE EXCEPTION 'not_a_member';
  END IF;

  SELECT count(*), count(*) FILTER (WHERE role = 'owner' AND user_id <> p_user_id)
    INTO v_member_count, v_other_owners
    FROM public.collection_members
    WHERE collection_id = p_collection_id;

  IF v_my_role = 'owner' AND v_other_owners = 0 THEN
    IF v_member_count = 1 THEN
      RAISE EXCEPTION 'sole_member';
    END IF;
    IF p_successor_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.collection_members
        WHERE collection_id = p_collection_id
          AND user_id = p_successor_id
          AND role <> 'owner'
    ) THEN
      RAISE EXCEPTION 'successor_required';
    END IF;
    UPDATE public.collection_members SET role = 'owner'
      WHERE collection_id = p_collection_id AND user_id = p_successor_id;
  END IF;

  DELETE FROM public.collection_members
    WHERE collection_id = p_collection_id AND user_id = p_user_id;
END;
$$;
