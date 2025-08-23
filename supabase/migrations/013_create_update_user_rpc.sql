-- Drop the function if it already exists to ensure a clean setup
DROP FUNCTION IF EXISTS update_user_rpc(user_id_to_update uuid, new_email text, new_password text, new_name text, new_role user_role);

CREATE OR REPLACE FUNCTION update_user_rpc(
  user_id_to_update uuid,
  new_email text,
  new_password text,
  new_name text,
  new_role user_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role text;
  auth_update_payload jsonb := '{}'::jsonb;
BEGIN
  -- 1. Check if the caller is an admin
  SELECT role INTO caller_role FROM public.users WHERE id = auth.uid();

  IF caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Permission denied: You must be an admin to update users.';
  END IF;

  -- 2. Update public.users table
  UPDATE public.users
  SET
    name = new_name,
    role = new_role,
    email = new_email -- Keep email in public.users in sync
  WHERE id = user_id_to_update;

  -- 3. Prepare payload for auth.users update
  IF new_email IS NOT NULL AND new_email <> '' THEN
    auth_update_payload := auth_update_payload || jsonb_build_object('email', new_email);
  END IF;

  IF new_password IS NOT NULL AND new_password <> '' THEN
    auth_update_payload := auth_update_payload || jsonb_build_object('password', new_password);
  END IF;

  -- 4. If there's anything to update in auth.users, elevate role and perform update
  IF jsonb_object_keys(auth_update_payload)::text[] <> ARRAY[]::text[] THEN
    SET LOCAL ROLE service_role;
    PERFORM auth.admin_update_user_by_id(user_id_to_update, auth_update_payload);
    -- Role is reset at the end of the transaction
  END IF;

END;
$$;

-- Grant execute permission to the 'authenticated' role
GRANT EXECUTE ON FUNCTION update_user_rpc(uuid, text, text, text, user_role) TO authenticated;
