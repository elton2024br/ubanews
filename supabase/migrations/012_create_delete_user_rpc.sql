-- Drop the function if it already exists to ensure a clean setup
DROP FUNCTION IF EXISTS delete_user_rpc(user_id_to_delete uuid);

CREATE OR REPLACE FUNCTION delete_user_rpc(user_id_to_delete uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role text;
BEGIN
  -- Check if the caller is an admin
  SELECT role INTO caller_role FROM public.users WHERE id = auth.uid();

  IF caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Permission denied: You must be an admin to delete users.';
  END IF;

  -- Elevate to service_role to perform admin actions
  SET LOCAL ROLE service_role;

  -- Perform the deletion
  PERFORM auth.admin_delete_user(user_id_to_delete);

  -- The role is automatically reset at the end of the transaction,
  -- but it's good practice to be explicit if needed elsewhere.
  -- RESET ROLE;
END;
$$;

-- Grant execute permission to the 'authenticated' role
GRANT EXECUTE ON FUNCTION delete_user_rpc(uuid) TO authenticated;
