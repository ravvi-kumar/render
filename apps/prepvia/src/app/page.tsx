import { redirect } from 'next/navigation';

export default async function Page() {
  const userId  = true ;


  if (!userId) {
    return redirect('/auth/sign-in');
  } else {
    redirect('/dashboard/overview');
  }
}
