# Admin Role Assignment Guide

## Security Improvements Implemented

All security vulnerabilities have been fixed:
- ✅ Role-based access control implemented
- ✅ Student data restricted to admin users only
- ✅ Database-level input validation added
- ✅ Separate user_roles table created
- ✅ New users receive 'user' role by default (not admin)

## Assigning Admin Role to Users

Since new signups now create users with the 'user' role, you need to manually assign the admin role to authorized users.

### Method 1: Using the Backend Interface

1. Click on "View Backend" in your project
2. Navigate to the SQL Editor
3. Run this query to make a user an admin (replace the email):

```sql
-- Find the user ID by email
SELECT id, email FROM auth.users WHERE email = 'your-admin@email.com';

-- Assign admin role (use the ID from above)
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

### Method 2: Quick Admin Assignment

To assign admin role to the first registered user:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;
```

### Method 3: Assign Admin to Current User

If you're logged in and want to make your account an admin:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

## Testing the Security

1. **Create a test user** without admin role
2. **Try to access the dashboard** - should see "Acesso Restrito" message
3. **Assign admin role** using one of the methods above
4. **Refresh the page** - should now see the full dashboard

## Available Roles

The system supports these roles:
- `admin` - Full access to manage students
- `teacher` - Can be used for future features
- `student` - Can be used for future features  
- `user` - Default role with no special permissions

## Security Notes

⚠️ **IMPORTANT**: Only assign admin roles to trusted users who need to manage student data.

✅ **Security Features**:
- All student operations require admin role
- Roles stored in separate table (not user profiles)
- SECURITY DEFINER function prevents RLS recursion
- Database constraints validate all input data
- Non-admin users see appropriate access denied messages
