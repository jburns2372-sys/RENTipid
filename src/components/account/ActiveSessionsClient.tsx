'use client';

import { useEffect, useState } from 'react';
import { LogOut, Monitor, RefreshCw } from 'lucide-react';

type SessionView = { id: string; isCurrent: boolean; created_at: string; last_seen_at: string; expires_at: string };
const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export default function ActiveSessionsClient() {
  const [sessions, setSessions] = useState<SessionView[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function load() { const response = await fetch('/api/account/sessions', { cache: 'no-store' }); if (response.ok) setSessions((await response.json()).sessions as SessionView[]); }
  useEffect(() => { void load(); }, []);
  async function revoke(id: string) { setBusy(true); setMessage(''); const response = await fetch(`/api/account/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' }); setMessage(response.ok ? 'Session revoked.' : 'Unable to revoke that session.'); await load(); setBusy(false); }
  async function revokeOthers() { setBusy(true); setMessage(''); const response = await fetch('/api/account/sessions/logout-others', { method: 'POST' }); setMessage(response.ok ? 'Other sessions revoked.' : 'Unable to revoke other sessions.'); await load(); setBusy(false); }
  return <main className="mx-auto max-w-3xl p-6 sm:p-8">
    <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-5"><div><h1 className="text-2xl font-semibold text-gray-900">Active sessions</h1><p className="mt-1 text-sm text-gray-600">Review where your account is signed in.</p></div><button type="button" onClick={() => void load()} title="Refresh sessions" className="rounded-md border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"><RefreshCw className="h-4 w-4" /></button></div>
    {message && <p className="mt-4 text-sm text-gray-700" role="status">{message}</p>}
    <div className="mt-6 divide-y divide-gray-200 border-y border-gray-200">{sessions.map((session) => <div key={session.id} className="flex items-center justify-between gap-4 py-5"><div className="flex min-w-0 items-start gap-3"><Monitor className="mt-1 h-5 w-5 shrink-0 text-gray-500" /><div><p className="font-medium text-gray-900">{session.isCurrent ? 'This device' : 'Signed-in device'}</p><p className="text-sm text-gray-600">Last active {formatDate(session.last_seen_at)}</p><p className="text-xs text-gray-500">Signed in {formatDate(session.created_at)} · Expires {formatDate(session.expires_at)}</p></div></div>{!session.isCurrent && <button type="button" disabled={busy} onClick={() => void revoke(session.id)} className="inline-flex shrink-0 items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"><LogOut className="h-4 w-4" />Log out</button>}</div>)}{!sessions.length && <p className="py-6 text-sm text-gray-600">No active sessions found.</p>}</div>
    <button type="button" disabled={busy} onClick={() => void revokeOthers()} className="mt-6 inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"><LogOut className="h-4 w-4" />Log out all other sessions</button>
  </main>;
}
