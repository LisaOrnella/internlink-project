export const metadata = { title: 'Account suspended' };
export default function Suspended() {
  return (
    <main id="main" className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="font-display text-2xl font-bold text-navy-900">Your account is suspended</h1>
      <p className="mt-2 max-w-md text-slate-600">An administrator has suspended this account. If you believe this is a mistake, please contact support.</p>
      <form action="/auth/signout" method="post" className="mt-6"><button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">Log out</button></form>
    </main>
  );
}
