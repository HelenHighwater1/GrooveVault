-- Serialize personal-vault creation per user. Without UNIQUE(owner_id),
-- two overlapping first-loads could both find no memberships and each
-- insert a vault — and the loser's duplicate would be un-leavable (its
-- only member can't leave). An advisory transaction lock keyed on the user
-- makes the second caller wait, then find the winner's membership.

CREATE OR REPLACE FUNCTION public.create_personal_collection(
  p_user_id text,
  p_name    text
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_collection_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id));

  -- The loser of a create race finds the winner's membership here rather
  -- than making a second vault. Any membership qualifies — if the user
  -- joined a shared vault in the meantime, that is the vault to return.
  SELECT collection_id INTO v_collection_id
    FROM public.collection_members
    WHERE user_id = p_user_id
    ORDER BY joined_at
    LIMIT 1;
  IF v_collection_id IS NOT NULL THEN
    RETURN v_collection_id;
  END IF;

  INSERT INTO public.collections (owner_id, name)
    VALUES (p_user_id, p_name)
    RETURNING id INTO v_collection_id;

  INSERT INTO public.collection_members (collection_id, user_id, role)
    VALUES (v_collection_id, p_user_id, 'owner');

  RETURN v_collection_id;
END;
$$;
