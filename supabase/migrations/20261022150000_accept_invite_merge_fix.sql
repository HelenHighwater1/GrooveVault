-- Fix accept_invite's merge loop: the FOR target is a scalar uuid, so rows
-- are referenced as v_solo, not v_solo.id.

CREATE OR REPLACE FUNCTION public.accept_invite(
  p_token   text,
  p_user_id text,
  p_merge   boolean DEFAULT false
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_invite     public.collection_invites%ROWTYPE;
  v_collection uuid;
  v_solo       uuid;
BEGIN
  SELECT * INTO v_invite FROM public.collection_invites
    WHERE token = p_token;
  IF v_invite.id IS NULL
     OR v_invite.status <> 'active'
     OR v_invite.expires_at <= now() THEN
    RAISE EXCEPTION 'invite_invalid';
  END IF;
  v_collection := v_invite.collection_id;

  PERFORM 1 FROM public.collection_members
    WHERE collection_id = v_collection
    FOR UPDATE;

  IF NOT EXISTS (
    SELECT 1 FROM public.collection_members
      WHERE collection_id = v_collection AND user_id = p_user_id
  ) THEN
    INSERT INTO public.collection_members (collection_id, user_id, role)
      VALUES (v_collection, p_user_id, 'member');
  END IF;

  IF p_merge THEN
    FOR v_solo IN
      SELECT m.collection_id
        FROM public.collection_members m
        WHERE m.user_id = p_user_id
          AND m.collection_id <> v_collection
          AND (
            SELECT count(*) FROM public.collection_members m2
              WHERE m2.collection_id = m.collection_id
          ) = 1
    LOOP
      UPDATE public.records SET collection_id = v_collection
        WHERE collection_id = v_solo;
      DELETE FROM public.collection_members
        WHERE collection_id = v_solo;
      DELETE FROM public.collections WHERE id = v_solo;
    END LOOP;
  END IF;

  RETURN v_collection;
END;
$$;
