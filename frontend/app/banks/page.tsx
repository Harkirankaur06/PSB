'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Landmark, Link2, ShieldCheck, Unplug } from 'lucide-react';
import { apiRequest } from '@/lib/api-client';

interface BankCatalogItem {
  id: string;
  bankCode: string;
  bankName: string;
  displayName: string;
  description: string;
  holderName: string;
  accountType: string;
  ifsc: string;
  accountNumberMasked: string;
}

interface ConnectedBank {
  id: string;
  alias: string;
  connectedAt: string;
  isPrimary: boolean;
  dataset: BankCatalogItem;
}

export default function BanksPage() {
  const [catalog, setCatalog] = useState<BankCatalogItem[]>([]);
  const [connections, setConnections] = useState<ConnectedBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [catalogResponse, connectionsResponse] = await Promise.all([
          apiRequest<BankCatalogItem[]>('/api/bank-link/catalog'),
          apiRequest<ConnectedBank[]>('/api/bank-link/connections'),
        ]);

        if (!active) {
          return;
        }

        setCatalog(catalogResponse);
        setConnections(connectionsResponse);
      } catch (err) {
        if (!active) {
          return;
        }

        setStatus(err instanceof Error ? err.message : 'Unable to load bank connections.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const connectBank = async (datasetId: string) => {
    setBusyId(datasetId);
    setStatus('');

    try {
      const result = await apiRequest<ConnectedBank[]>('/api/bank-link/connections', {
        method: 'POST',
        body: JSON.stringify({ datasetId }),
      });

      setConnections(result);
      setStatus('Bank account connected and synced into your L.E.G.E.N.D. profile.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to connect this bank.');
    } finally {
      setBusyId(null);
    }
  };

  const disconnectBank = async (connectionId: string) => {
    setBusyId(connectionId);
    setStatus('');

    try {
      const result = await apiRequest<ConnectedBank[]>(`/api/bank-link/connections/${connectionId}`, {
        method: 'DELETE',
      });

      setConnections(result);
      setStatus('Bank account disconnected and synced balances were refreshed.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to disconnect this bank.');
    } finally {
      setBusyId(null);
    }
  };

  const connectedDatasetIds = new Set(connections.map((item) => item.dataset.id));

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">Loading bank connection center...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Bank Connections</h1>
          <p className="text-muted-foreground">
            Connect up to 3 dummy bank datasets so L.E.G.E.N.D. can use their balances and transactions.
          </p>
        </div>

        <Card className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-3 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Connection policy</h2>
                <p className="text-sm text-muted-foreground">
                  One user can connect up to 3 dummy banks. Connected datasets are synced into financial overview, transactions, AI insights, and security flows.
                </p>
              </div>
            </div>
            <div className="rounded-full bg-muted px-4 py-2 text-sm text-foreground">
              {connections.length}/3 connected
            </div>
          </div>
          {status && <p className="mt-4 text-sm text-foreground">{status}</p>}
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Available dummy banks</h2>
            <div className="space-y-4">
              {catalog.map((bank) => {
                const connected = connectedDatasetIds.has(bank.id);
                const full = connections.length >= 3 && !connected;

                return (
                  <div key={bank.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Landmark className="h-4 w-4 text-primary" />
                          <p className="font-semibold text-foreground">{bank.displayName}</p>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{bank.description}</p>
                        <p className="mt-3 text-sm text-foreground">
                          {bank.bankName} • {bank.accountNumberMasked}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {bank.accountType} • IFSC {bank.ifsc}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => connectBank(bank.id)}
                        disabled={connected || full || busyId === bank.id}
                      >
                        <Link2 className="h-4 w-4" />
                        {connected ? 'Connected' : busyId === bank.id ? 'Connecting...' : 'Connect'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Connected bank accounts</h2>
            <div className="space-y-4">
              {connections.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  No banks connected yet. Connect at least one bank so your dashboard and insights reflect linked account data.
                </div>
              ) : (
                connections.map((connection) => (
                  <div key={connection.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-foreground">
                          {connection.dataset.displayName}
                          {connection.isPrimary ? ' • Primary' : ''}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {connection.dataset.bankName} • {connection.dataset.accountNumberMasked}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Connected {new Date(connection.connectedAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => disconnectBank(connection.id)}
                        disabled={busyId === connection.id}
                      >
                        <Unplug className="h-4 w-4" />
                        {busyId === connection.id ? 'Disconnecting...' : 'Disconnect'}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
