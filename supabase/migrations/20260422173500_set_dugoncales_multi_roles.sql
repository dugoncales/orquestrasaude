-- Grant multiple roles (including admin) to a specific user by email.
DO $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT id
    INTO target_user_id
  FROM auth.users
  WHERE email = 'dugoncales@gmail.com'
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'User with email dugoncales@gmail.com not found in auth.users';
    RETURN;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES
    (target_user_id, 'professional'::public.app_role),
    (target_user_id, 'manager'::public.app_role),
    (target_user_id, 'admin'::public.app_role),
    (target_user_id, 'patient'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.profiles
  SET email = 'dugoncales@gmail.com'
  WHERE id = target_user_id;
END;
$$;
