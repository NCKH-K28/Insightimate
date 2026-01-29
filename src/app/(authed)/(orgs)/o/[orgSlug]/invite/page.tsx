'use client';

import { useParamsRequired, useSearchParamsRequired } from '@/hooks/next-navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React from 'react';

type Invite = {
  organization: { id: string; name: string; logoURL?: string };
  invitation: { email: string; role: string; expiresAt: string };
  inviter: { id: string; name: string | null; email: string };
  // backend có thể trả error string
  error?: string;
};

export default function Page() {
  const router = useRouter();

  const query = useSearchParamsRequired();
  const params = useParamsRequired<{ orgSlug: string }>();

  const orgId = params.orgSlug;
  const token = query.get('token') ?? undefined;

  const tokenQueryString = React.useMemo(
    () => new URLSearchParams(token ? { token } : {}).toString(),
    [token],
  );

  const fetchData = useQuery({
    queryKey: ['org-invite', orgId, token],
    queryFn: async () => {
      const path = `/api/v3/me/orgs/${orgId}/invite`;
      const url = token ? `${path}?${tokenQueryString}` : path;
      const res = await fetch(url);
      if (!res.ok) {
        let msg = 'Failed to fetch invite info';
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {}
        throw new Error(msg);
      }
      return res.json() as Promise<Invite>;
    },
    enabled: !!token,
    retry: false,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const paht = `/api/v3/me/orgs/${orgId}/invite/accept`;
      const res = await fetch(`/api/v3/me/orgs/${orgId}/invite/accept?${tokenQueryString}`, {
        method: 'POST',
      });
      if (!res.ok) {
        let msg = 'Failed to accept invite';
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {}
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      // Option A: về org
      router.replace(`/o/${orgId}`);
      // Option B: về danh sách org:
      // router.replace('/me/orgs');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/v3/me/orgs/${orgId}/invite/reject?${tokenQueryString}`, {
        method: 'POST',
      });
      if (!res.ok) {
        let msg = 'Failed to reject invite';
        try {
          const body = await res.json();
          if (body?.error) msg = body.error;
        } catch {}
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      // sau khi từ chối thì về đâu tuỳ bạn
      router.replace('/me/orgs');
    },
  });

  const handleAccept = () => {
    if (!token) return;
    acceptMutation.mutate();
  };

  const handleReject = () => {
    if (!token) return;
    rejectMutation.mutate();
  };

  if (!token) return <div>Missing token</div>;

  if (fetchData.isLoading) return <div>Loading...</div>;
  if (fetchData.isError) return <div>Error: {fetchData.error.message}</div>;
  if (!fetchData.data) return <div>No data</div>;
  if (fetchData.data.error) return <div>Error: {fetchData.data.error}</div>;

  const { organization, invitation, inviter } = fetchData.data;

  const busy = acceptMutation.isPending || rejectMutation.isPending;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>Invite to Organization: {organization.name}</h1>

      <div style={{ marginTop: 12 }}>
        <p>
          <strong>Invited Email:</strong> {invitation.email}
        </p>
        <p>
          <strong>Role:</strong> {invitation.role}
        </p>
        <p>
          <strong>Expires At:</strong> {new Date(invitation.expiresAt).toLocaleString()}
        </p>
        <p>
          <strong>Inviter:</strong> {inviter.name ?? inviter.email} ({inviter.email})
        </p>
      </div>

      {(acceptMutation.isError || rejectMutation.isError) && (
        <div style={{ marginTop: 12, color: 'crimson' }}>
          {acceptMutation.isError && <div>{(acceptMutation.error as Error).message}</div>}
          {rejectMutation.isError && <div>{(rejectMutation.error as Error).message}</div>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button
          onClick={handleAccept}
          disabled={busy}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #ddd',
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {acceptMutation.isPending ? 'Accepting…' : 'Accept invite'}
        </button>

        <button
          onClick={handleReject}
          disabled={busy}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid #ddd',
            cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {rejectMutation.isPending ? 'Rejecting…' : 'Reject invite'}
        </button>
      </div>
    </div>
  );
}
