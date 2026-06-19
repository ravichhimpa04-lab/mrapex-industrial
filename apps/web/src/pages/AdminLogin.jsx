import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMsg(error.message);
    } else {
      window.location.href = '/admin';
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={handleLogin}
        className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 space-y-4"
      >
        <h1 className="text-2xl font-bold text-center">
          MR Apex Admin Login
        </h1>

        <input
          type="email"
          placeholder="Admin Email"
          className="w-full border rounded-lg px-4 py-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded-lg px-4 py-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {msg && (
          <p className="text-red-600 text-sm">
            {msg}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </div>
  );
}

export default AdminLogin;