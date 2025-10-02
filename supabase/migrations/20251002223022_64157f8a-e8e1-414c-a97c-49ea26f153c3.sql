-- 1. Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. Update alunos RLS policies to require admin role
DROP POLICY IF EXISTS "Authenticated users can view all students" ON public.alunos;
DROP POLICY IF EXISTS "Authenticated users can insert students" ON public.alunos;
DROP POLICY IF EXISTS "Authenticated users can update students" ON public.alunos;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON public.alunos;

CREATE POLICY "Only admins can view students"
  ON public.alunos FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert students"
  ON public.alunos FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = created_by);

CREATE POLICY "Only admins can update students"
  ON public.alunos FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete students"
  ON public.alunos FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Add database constraints for input validation
ALTER TABLE public.alunos 
  ALTER COLUMN nome TYPE VARCHAR(100),
  ALTER COLUMN email TYPE VARCHAR(255),
  ALTER COLUMN matricula TYPE VARCHAR(50),
  ALTER COLUMN curso TYPE VARCHAR(100);

ALTER TABLE public.alunos
  ADD CONSTRAINT nome_length CHECK (length(trim(nome)) >= 3),
  ADD CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT matricula_not_empty CHECK (length(trim(matricula)) > 0),
  ADD CONSTRAINT status_valid CHECK (status IN ('Ativo', 'Trancado', 'Formado'));

-- 5. Fix handle_new_user to NOT auto-assign admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with username only (no role field)
  INSERT INTO public.profiles (id, username)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  
  -- Assign 'user' role by default (NOT admin)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- 6. Remove role column from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS role;

-- 7. Add explicit policies to profiles table
CREATE POLICY "No direct profile inserts"
  ON public.profiles FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Users can update own username only"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "No profile deletion"
  ON public.profiles FOR DELETE
  USING (false);

-- 8. Add RLS policy for user_roles (users can view their own roles)
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "No direct role modifications"
  ON public.user_roles FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct role updates"
  ON public.user_roles FOR UPDATE
  USING (false);

CREATE POLICY "No direct role deletions"
  ON public.user_roles FOR DELETE
  USING (false);