-- Drop the function if it already exists
DROP FUNCTION IF EXISTS toggle_user_status_rpc(user_id_to_toggle uuid);

CREATE OR REPLACE FUNCTION toggle_user_status_rpc(user_id_to_toggle uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role text;
  current_status boolean;
BEGIN
  -- 1. Check if the caller is an admin
  SELECT role INTO caller_role FROM public.users WHERE id = auth.uid();

  IF caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Permission denied: You must be an admin to change user status.';
  END IF;

  -- 2. Prevent admin from deactivating themselves
  IF auth.uid() = user_id_to_toggle THEN
    RAISE EXCEPTION 'Action denied: Admins cannot deactivate themselves.';
  END IF;

  -- 3. Get current status and update
  SELECT is_active INTO current_status FROM public.users WHERE id = user_id_to_toggle;

  UPDATE public.users
  SET is_active = NOT current_status
  WHERE id = user_id_to_toggle;

END;
$$;

-- Grant execute permission to the 'authenticated' role
GRANT EXECUTE ON FUNCTION toggle_user_status_rpc(uuid) TO authenticated;
