import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED: { prefix: string; role: 'student' | 'company' | 'admin' }[] = [
  { prefix: '/dashboard', role: 'student' },
  { prefix: '/company', role: 'company' },
  { prefix: '/admin', role: 'admin' },
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return response;

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() validates the JWT with Supabase (never trust getSession() for authorization)
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const rule = PROTECTED.find((p) => path === p.prefix || path.startsWith(p.prefix + '/'));
  const isAuthPage = ['/login', '/register'].includes(path);

  if (rule && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }

  if (user && (rule || isAuthPage)) {
    const { data: profile } = await supabase.from('profiles').select('role,status').eq('id', user.id).single();
    const home = profile?.role === 'admin' ? '/admin' : profile?.role === 'company' ? '/company' : '/dashboard';
    if (profile?.status === 'suspended') {
      const url = request.nextUrl.clone();
      url.pathname = '/suspended';
      url.search = '';
      return NextResponse.redirect(url);
    }
    if (rule && profile?.role !== rule.role) {
      const url = request.nextUrl.clone();
      url.pathname = home;
      url.search = '';
      return NextResponse.redirect(url);
    }
    if (isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = home;
      url.search = '';
      return NextResponse.redirect(url);
    }
  }
  return response;
}
