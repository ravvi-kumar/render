'use client';

import { authClient } from '@/lib/auth-client';
import { Session, User } from 'better-auth/types';
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState
} from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthContext {
  session: Session | null;
  user: any | null;
  isLoading: boolean;
  setSession: React.Dispatch<React.SetStateAction<Session | null>>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContext>({
  session: null,
  user: null,
  isLoading: true,
  setSession: () => {},
  setUser: () => { },
});

export const AuthContextProvider = ({ children }: PropsWithChildren) => {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: response } = await authClient.getSession();

        if (!response?.session) {
          // redirect
          router.push('/auth/sign-in');
        } else {
          setSession(response?.session);
          setUser(response?.user || null);
        }
      } catch (error) {
        console.log('Failed to get the respone of the session');
      } finally {
        setIsLoading(false);
      }
    };

    getSession();
  }, [router]);

  // if(isLoading){
  //   return <Loader/>
  // }

  return (
    <AuthContext.Provider
      value={{
        session: session,
        user: user,
        isLoading: isLoading,
        setSession,
        setUser,
      }}
    >
      {
        children
      }
    </AuthContext.Provider>
  );
};

export const useAuthSession = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      'Please wrap your page in AuthContextProvider to use this hook'
    );
  }
  return context;
};


function Loader() {
  return (
    <div className='relative z-10 bg-white h-screen flex justify-center flex-col items-center gap-2' >
      <Loader2 className='size-6 animate-spin' color='blue' />
      <p>Loading.....</p>
    </div>
  )
}