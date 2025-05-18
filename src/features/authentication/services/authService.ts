import supabase from '@/assets/supabase/client';
import type {
  AuthError,
  AuthResponse,

  SignUpWithPasswordCredentials,
  SignInWithPasswordCredentials
} from '@supabase/supabase-js';


export const signUpUser = async (
  credentials: SignUpWithPasswordCredentials
): Promise<AuthResponse> => {
  console.log('[authService.signUpUser] Attempting to sign up with email:', (credentials as any).email);
  const response = await supabase.auth.signUp(credentials);
  console.log('[authService.signUpUser] Supabase response:', { data: response.data, error: response.error });
  return response;
};


export const signInWithPassword = async (
  credentials: SignInWithPasswordCredentials
): Promise<AuthResponse> => {
  console.log('[authService.signInWithPassword] Attempting to sign in with email:', (credentials as any).email);
  const response = await supabase.auth.signInWithPassword(credentials);
  console.log('[authService.signInWithPassword] Supabase response:', { data: response.data, error: response.error });
  return response;
};

export const signOutUser = async (): Promise<{ error: AuthError | null }> => {
  console.log('[authService.signOutUser] Attempting to sign out.');
  const { error } = await supabase.auth.signOut();
  console.log('[authService.signOutUser] Supabase response:', { error });
  return { error };
};