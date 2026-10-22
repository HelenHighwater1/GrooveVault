-- accept_invite v4: take every lock this transaction needs up front, in
-- ascending collection_id order — concurrent accepts can't deadlock. And a
-- merge source only qualifies if p_user is still its sole member under the
-- lock, so an owner removing p_user can't turn their shared vault into a
-- "solo" merge candidate.

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
  v_lock       uuid;
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

  -- Lock the target plus (when merging) every other vault p_user belongs
  -- to, always in ascending id order. Any transaction touching the same
  -- set acquires locks in the same sequence, so no cycle can form.
  FOR v_lock IN
    SELECT collection_id FROM (
      SELECT v_collection AS collection_id
      UNION ALL
      SELECT m.collection_id
        FROM public.collection_members m
        WHERE p_merge
          AND m.user_id = p_user_id
          AND m.collection_id <> v_collection
    ) t
    ORDER BY collection_id
  LOOP
    PERFORM 1 FROM public.collection_members
      WHERE collection_id = v_lock
      FOR UPDATE;
  END LOOP;

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
    LOOP
      -- Merge only vaults where p_user is still the sole member — checked
      -- under the lock, so a concurrent leave/remove can't make a shared
      -- vault look solo, or strip p_user's own membership mid-merge.
      IF EXISTS (
           SELECT 1 FROM public.collection_members
             WHERE collection_id = v_solo AND user_id = p_user_id
         )
         AND NOT EXISTS (
           SELECT 1 FROM public.collection_members
             WHERE collection_id = v_solo AND user_id <> p_user_id
         ) THEN
        UPDATE public.records SET collection_id = v_collection
          WHERE collection_id = v_solo;
        DELETE FROM public.collection_members
          WHERE collection_id = v_solo;
        DELETE FROM public.collections WHERE id = v_solo;
      END IF;
    END LOOP;
  END IF;

  RETURN v_collection;
END;
$$;
