import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

function ProtectedAdmin({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data?.session?.user;

      const adminEmails = import.meta.env.VITE_ADMIN_EMAILS
        ?.split(',')
        .map((email) => email.trim().toLowerCase());

      if (user && adminEmails?.includes(user.email.toLowerCase())) {
        setAllowed(true);
      } else {
        setAllowed(false);
      }

      setLoading(false);
    };

    checkAdmin();
  }, []);

  if (loading) {
    return <div className="p-6">Checking admin access...</div>;
  }

  if (!allowed) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}

export default ProtectedAdmin;