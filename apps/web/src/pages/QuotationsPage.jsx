import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

function QuotationsPage() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchQuotations() {
    setLoading(true);

    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      alert('Quotation load nahi hui');
    } else {
      setQuotations(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    fetchQuotations();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quotations</h1>
            <p className="text-sm text-slate-500">
              MR Apex Industrial Components quotation history
            </p>
          </div>

          <Link
            to="/admin/quotations/new"
            className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800"
          >
            + New Quotation
          </Link>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : quotations.length === 0 ? (
          <p className="text-slate-500">Abhi koi quotation nahi bani.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-3 text-left">Quotation No</th>
                  <th className="p-3 text-left">Customer</th>
                  <th className="p-3 text-left">Company</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>

              <tbody>
                {quotations.map((q) => (
                  <tr key={q.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-semibold">{q.quotation_no}</td>

                    <td className="p-3">{q.customer_name}</td>

                    <td className="p-3">{q.company_name}</td>

                    <td className="p-3">{q.quotation_date}</td>

                    <td className="p-3 text-right">
                      ₹ {Number(q.grand_total || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">
                        {q.status || 'Draft'}
                      </span>
                    </td>

                    <td className="p-3">
                      <Link
                        to={`/admin/quotations/${q.id}`}
                        className="text-blue-600 underline font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6">
          <Link to="/admin" className="text-blue-600">
            ← Back to Admin
          </Link>
        </div>
      </div>
    </div>
  );
}

export default QuotationsPage;