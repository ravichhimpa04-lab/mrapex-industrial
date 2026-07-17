import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import {
  BarChart3,
  IndianRupee,
  FileText,
  Send,
  MessageCircleReply,
  Inbox,
  Clock,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const ENQUIRY_API_URL =
  'https://script.google.com/macros/s/AKfycbxe0bxrj8lMIkRhUJC2AEB_brBmNPVTYctVM1AJmMY1r7Us2lchynQFDkAcLFeOG7ji/exec';

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

export default function CEODashboard() {
  const [quotations, setQuotations] = useState([]);
  const [enquiriesCount, setEnquiriesCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [{ data: quotationsData, error: quotationsError }, enquiriesResult] =
        await Promise.all([
          supabase
            .from('quotations')
            .select(
              'id, quotation_no, customer_name, company_name, status, grand_total, created_at, sent_at, customer_replied'
            )
            .order('created_at', { ascending: false }),
          fetch(`${ENQUIRY_API_URL}?type=enquiries`)
            .then((response) => response.json())
            .catch(() => ({ success: false })),
        ]);

      if (quotationsError) {
        console.error('CEO dashboard quotations error:', quotationsError);
        setError('Could not load quotation data');
      } else {
        setQuotations(quotationsData || []);
      }

      if (enquiriesResult?.success) {
        setEnquiriesCount((enquiriesResult.enquiries || []).length);
      }

      setLastUpdated(new Date());
    } catch (fetchError) {
      console.error('CEO dashboard fetch error:', fetchError);
      setError('Could not load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalQuotations = quotations.length;

  const sentQuotations = useMemo(
    () => quotations.filter((item) => item.status === 'Sent'),
    [quotations]
  );

  const draftQuotations = useMemo(
    () => quotations.filter((item) => (item.status || 'Draft') !== 'Sent'),
    [quotations]
  );

  const totalQuotedValue = useMemo(
    () => quotations.reduce((sum, item) => sum + Number(item.grand_total || 0), 0),
    [quotations]
  );

  const sentValue = useMemo(
    () => sentQuotations.reduce((sum, item) => sum + Number(item.grand_total || 0), 0),
    [sentQuotations]
  );

  const repliedCount = useMemo(
    () => sentQuotations.filter((item) => item.customer_replied).length,
    [sentQuotations]
  );

  const replyRate = sentQuotations.length > 0 ? (repliedCount / sentQuotations.length) * 100 : 0;

  const conversionRate = enquiriesCount > 0 ? (totalQuotations / enquiriesCount) * 100 : 0;

  const monthlyRevenue = useMemo(() => {
    const buckets = new Map();

    sentQuotations.forEach((item) => {
      const dateSource = item.sent_at || item.created_at;
      if (!dateSource) return;

      const date = new Date(dateSource);
      if (Number.isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

      if (!buckets.has(key)) {
        buckets.set(key, { key, label, value: 0 });
      }

      buckets.get(key).value += Number(item.grand_total || 0);
    });

    return Array.from(buckets.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-6);
  }, [sentQuotations]);

  const topCompanies = useMemo(() => {
    const buckets = new Map();

    quotations.forEach((item) => {
      const company = item.company_name || 'Unknown';

      if (!buckets.has(company)) {
        buckets.set(company, { company, total: 0, count: 0 });
      }

      const bucket = buckets.get(company);
      bucket.total += Number(item.grand_total || 0);
      bucket.count += 1;
    });

    return Array.from(buckets.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [quotations]);

  const recentLargeQuotations = useMemo(
    () =>
      [...quotations]
        .sort((a, b) => Number(b.grand_total || 0) - Number(a.grand_total || 0))
        .slice(0, 5),
    [quotations]
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BarChart3 className="w-8 h-8" />
                CEO Dashboard
              </h1>
              <p className="text-slate-300 mt-2">Business Overview - MR Apex Industrial Components</p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2">
              <div className="text-sm text-slate-300">
                {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
              </div>

              <div className="flex items-center gap-2">
                <Link
                  to="/admin/apex"
                  className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded-lg"
                >
                  🤖 Apex Dashboard
                </Link>

                <button
                  type="button"
                  onClick={fetchData}
                  disabled={loading}
                  className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-orange-500/10 border border-orange-500/30 text-orange-300 text-sm rounded-lg px-3 py-2">
              ⚠ {error}
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow border p-4">
            <h2 className="text-gray-500 text-xs flex items-center gap-1.5">
              <Inbox className="w-3.5 h-3.5" />
              Total Enquiries
            </h2>
            <div className="text-2xl font-bold mt-2">{loading ? '…' : enquiriesCount}</div>
          </div>

          <div className="bg-white rounded-xl shadow border p-4">
            <h2 className="text-gray-500 text-xs flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Total Quotations
            </h2>
            <div className="text-2xl font-bold mt-2">{loading ? '…' : totalQuotations}</div>
          </div>

          <div className="bg-white rounded-xl shadow border p-4">
            <h2 className="text-gray-500 text-xs flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" />
              Quotations Sent
            </h2>
            <div className="text-2xl font-bold mt-2">{loading ? '…' : sentQuotations.length}</div>
          </div>

          <div className="bg-white rounded-xl shadow border p-4">
            <h2 className="text-gray-500 text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Pending (Draft)
            </h2>
            <div className="text-2xl font-bold mt-2">{loading ? '…' : draftQuotations.length}</div>
          </div>

          <div className="bg-white rounded-xl shadow border p-4">
            <h2 className="text-gray-500 text-xs flex items-center gap-1.5">
              <MessageCircleReply className="w-3.5 h-3.5" />
              Reply Rate
            </h2>
            <div className="text-2xl font-bold mt-2">{loading ? '…' : `${replyRate.toFixed(0)}%`}</div>
          </div>

          <div className="bg-white rounded-xl shadow border p-4">
            <h2 className="text-gray-500 text-xs flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5" />
              Total Quoted Value
            </h2>
            <div className="text-lg font-bold mt-2">
              {loading ? '…' : formatCurrency(totalQuotedValue)}
            </div>
          </div>
        </div>

        {/* Secondary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow border p-5">
            <h2 className="text-sm text-gray-500 mb-1">Enquiry → Quotation Conversion</h2>
            <div className="text-3xl font-bold text-slate-900">
              {loading ? '…' : `${conversionRate.toFixed(0)}%`}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {totalQuotations} quotations created from {enquiriesCount} enquiries
            </p>
          </div>

          <div className="bg-white rounded-xl shadow border p-5">
            <h2 className="text-sm text-gray-500 mb-1">Value of Sent Quotations</h2>
            <div className="text-3xl font-bold text-slate-900">
              {loading ? '…' : formatCurrency(sentValue)}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Across {sentQuotations.length} quotations sent to customers
            </p>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className="bg-white rounded-xl shadow border p-6">
          <h2 className="text-xl font-bold mb-4">Quoted Revenue Trend (Sent Quotations)</h2>

          {loading ? (
            <p className="text-sm text-gray-500">Loading chart...</p>
          ) : monthlyRevenue.length === 0 ? (
            <p className="text-sm text-gray-500">Not enough data yet to show a trend.</p>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#0f172a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top Companies + Recent Large Quotations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow border p-6">
            <h2 className="text-xl font-bold mb-4">Top Companies by Quoted Value</h2>

            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : topCompanies.length === 0 ? (
              <p className="text-sm text-gray-500">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {topCompanies.map((item) => (
                  <div
                    key={item.company}
                    className="flex items-center justify-between border-b pb-2 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-sm text-slate-900">{item.company}</p>
                      <p className="text-xs text-gray-400">{item.count} quotation(s)</p>
                    </div>
                    <p className="font-semibold text-sm text-slate-900">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow border p-6">
            <h2 className="text-xl font-bold mb-4">Largest Quotations</h2>

            {loading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : recentLargeQuotations.length === 0 ? (
              <p className="text-sm text-gray-500">No data yet.</p>
            ) : (
              <div className="space-y-3">
                {recentLargeQuotations.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b pb-2 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-sm text-slate-900">
                        {item.quotation_no} — {item.customer_name || item.company_name}
                      </p>
                      <p className="text-xs text-gray-400">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${
                            item.status === 'Sent'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {item.status || 'Draft'}
                        </span>
                      </p>
                    </div>
                    <p className="font-semibold text-sm text-slate-900">
                      {formatCurrency(item.grand_total)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
