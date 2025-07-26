import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    let response;
    if (isLogin) {
      response = await supabase.auth.signInWithPassword({ email, password });
    } else {
      response = await supabase.auth.signUp({ email, password });
    }

    if (response.error) {
      setError(response.error.message);
    } 
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-8 space-y-6 bg-stone-900/60 rounded-lg border border-stone-700 shadow-xl">
        <h1 className="text-5xl font-cinzel text-center text-stone-100 tracking-widest">VAESEN</h1>
        <p className="text-center text-stone-400">{isLogin ? 'Log in to continue your hunt.' : 'Create an account to begin.'}</p>
        
        {error && <p className="text-center text-red-400 bg-red-900/50 p-2 rounded">{error}</p>}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <input
              id="email"
              className="w-full bg-stone-800 p-3 rounded border border-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              id="password"
              className="w-full bg-stone-800 p-3 rounded border border-stone-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <button className="w-full font-cinzel text-xl bg-emerald-800/80 hover:bg-emerald-700/80 text-white font-bold py-3 px-12 rounded-lg shadow-lg disabled:opacity-50" disabled={loading}>
              {loading ? 'Loading...' : (isLogin ? 'Log In' : 'Sign Up')}
            </button>
          </div>
        </form>
        <p className="text-center text-sm">
          <button onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-emerald-400 hover:underline">
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Log in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
