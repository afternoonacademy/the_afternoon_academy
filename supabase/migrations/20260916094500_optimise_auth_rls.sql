alter policy "Users can view own roles" on public.user_roles
using ((select auth.uid()) = user_id);

alter policy "Users can view own profile" on public.users
using ((select auth.uid()) = auth_user_id);

alter policy "Users can update own profile" on public.users
using ((select auth.uid()) = auth_user_id)
with check ((select auth.uid()) = auth_user_id);
