'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowRightLeft,
  Landmark,
  Link2,
  Send,
  ShieldCheck,
  Unplug,
} from 'lucide-react';
import { apiRequest } from '@/lib/api-client';
import { useBehaviorMonitor } from '@/lib/behavior-monitor';

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
  currentBalance: number;
  dataset: BankCatalogItem;
}

interface InternalTransferPreview {
  fromAccount: {
    id: string;
    label: string;
    bankName: string;
    accountNumberMasked: string;
    balance: number;
  };
  toAccount: {
    id: string;
    label: string;
    bankName: string;
    accountNumberMasked: string;
    balance: number;
  };
  amount: number;
  wealthIntelligence: {
    sourceBalanceBefore: number;
    sourceBalanceAfter: number;
    destinationBalanceBefore: number;
    destinationBalanceAfter: number;
    monthlySurplus: number;
    savingsImpactPercent: number;
    headline: string;
    aiRecommendation: string;
    goalImpact: Array<{
      title: string;
      remainingAmount: number;
      pressureLevel: string;
    }>;
  };
  cyberProtection: {
    riskScore: number;
    riskLevel: string;
    reasons: string[];
    signals: string[];
  };
  decision: 'allow' | 'warn' | 'block';
}

interface ExternalTransferPreview {
  beneficiary: {
    beneficiaryName: string;
    beneficiaryAccountMasked: string;
    ifsc: string;
    bankName: string;
    transferMode: string;
    purpose: string;
    note: string;
    isNewBeneficiary: boolean;
  };
  wealthIntelligence: {
    currentBalance: number;
    projectedBalance: number;
    monthlySurplus: number;
    savingsImpactPercent: number;
    goalImpact: string;
    aiRecommendation: string;
  };
  cyberProtection: {
    riskScore: number;
    decision: 'allow' | 'warn' | 'block';
    reasons: string[];
    explainability: Array<{
      label: string;
      points: number;
      reason: string;
    }>;
    signals: string[];
    calmMessage: string;
    coolingOffSeconds: number;
  };
}

export default function BanksPage() {
  const { track, snapshot } = useBehaviorMonitor('banks');
  const [catalog, setCatalog] = useState<BankCatalogItem[]>([]);
  const [connections, setConnections] = useState<ConnectedBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [internalTransferOpen, setInternalTransferOpen] = useState(false);
  const [internalTransferBusy, setInternalTransferBusy] = useState(false);
  const [internalOtpBusy, setInternalOtpBusy] = useState(false);
  const [internalTransferStatus, setInternalTransferStatus] = useState('');
  const [internalPreview, setInternalPreview] = useState<InternalTransferPreview | null>(null);
  const [internalTransferForm, setInternalTransferForm] = useState({
    fromConnectionId: '',
    toConnectionId: '',
    amount: '',
    pin: '',
    otp: '',
  });

  const [externalTransferOpen, setExternalTransferOpen] = useState(false);
  const [externalTransferBusy, setExternalTransferBusy] = useState(false);
  const [externalOtpBusy, setExternalOtpBusy] = useState(false);
  const [externalTransferStatus, setExternalTransferStatus] = useState('');
  const [externalPreview, setExternalPreview] = useState<ExternalTransferPreview | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [externalForm, setExternalForm] = useState({
    beneficiaryName: '',
    beneficiaryAccount: '',
    ifsc: '',
    bankName: '',
    amount: '',
    category: 'Personal',
    note: '',
    channel: 'NEFT',
    otp: '',
  });

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

  useEffect(() => {
    if (cooldownRemaining <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCooldownRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldownRemaining]);

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
      const result = await apiRequest<ConnectedBank[]>(
        `/api/bank-link/connections/${connectionId}`,
        {
          method: 'DELETE',
        }
      );

      setConnections(result);
      setStatus('Bank account disconnected and synced balances were refreshed.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Unable to disconnect this bank.');
    } finally {
      setBusyId(null);
    }
  };

  const openInternalTransferDialog = () => {
    track('dialog_open', { detail: 'internal transfer dialog' });
    setInternalTransferStatus('');
    setInternalPreview(null);
    setInternalTransferForm({
      fromConnectionId: connections[0]?.id || '',
      toConnectionId: connections[1]?.id || '',
      amount: '',
      pin: '',
      otp: '',
    });
    setInternalTransferOpen(true);
  };

  const previewInternalTransfer = async () => {
    setInternalTransferBusy(true);
    setInternalTransferStatus('');

    try {
      const response = await apiRequest<InternalTransferPreview>(
        '/api/bank-link/internal-transfer/preview',
        {
          method: 'POST',
          body: JSON.stringify({
            fromConnectionId: internalTransferForm.fromConnectionId,
            toConnectionId: internalTransferForm.toConnectionId,
            amount: Number(internalTransferForm.amount),
          }),
        }
      );

      setInternalPreview(response);
    } catch (err) {
      setInternalTransferStatus(
        err instanceof Error ? err.message : 'Unable to preview transfer.'
      );
    } finally {
      setInternalTransferBusy(false);
    }
  };

  const sendInternalOtp = async () => {
    setInternalOtpBusy(true);
    setInternalTransferStatus('');

    try {
      const response = await apiRequest<{ deliveryMode: string }>(
        '/api/security/transaction-otp/send',
        {
          method: 'POST',
        }
      );
      setInternalTransferStatus(
        response.deliveryMode === 'smtp'
          ? 'OTP sent for transfer approval.'
          : 'OTP generated in fallback mode. Check backend logs if email is not configured.'
      );
    } catch (err) {
      setInternalTransferStatus(err instanceof Error ? err.message : 'Unable to send OTP.');
    } finally {
      setInternalOtpBusy(false);
    }
  };

  const executeInternalTransfer = async () => {
    setInternalTransferBusy(true);
    setInternalTransferStatus('');

    try {
      const response = await apiRequest<{
        executed: boolean;
        decision: 'allow' | 'warn' | 'block';
        connections?: ConnectedBank[];
      }>('/api/bank-link/internal-transfer/execute', {
        method: 'POST',
        body: JSON.stringify({
          fromConnectionId: internalTransferForm.fromConnectionId,
          toConnectionId: internalTransferForm.toConnectionId,
          amount: Number(internalTransferForm.amount),
          pin: internalTransferForm.pin,
          otp: internalTransferForm.otp,
        }),
      });

      if (response.connections) {
        setConnections(response.connections);
      }

      window.dispatchEvent(new Event('legend-security-refresh'));

      setInternalTransferStatus(
        response.executed
          ? 'Internal transfer executed successfully. Balances, logs, and the digital twin are now updated.'
          : response.decision === 'warn'
            ? 'Transfer moved into protected review and was not executed automatically.'
            : 'Transfer was blocked by the protection engine before execution.'
      );
    } catch (err) {
      setInternalTransferStatus(
        err instanceof Error ? err.message : 'Unable to execute transfer.'
      );
    } finally {
      setInternalTransferBusy(false);
    }
  };

  const openExternalTransferDialog = () => {
    track('dialog_open', { detail: 'external transfer dialog' });
    setExternalTransferStatus('');
    setExternalPreview(null);
    setCooldownRemaining(0);
    setExternalForm({
      beneficiaryName: '',
      beneficiaryAccount: '',
      ifsc: '',
      bankName: '',
      amount: '',
      category: 'Personal',
      note: '',
      channel: 'NEFT',
      otp: '',
    });
    setExternalTransferOpen(true);
  };

  const previewExternalTransfer = async () => {
    setExternalTransferBusy(true);
    setExternalTransferStatus('');
    track('submit_attempt', { detail: 'external transfer preview' });

    try {
      const response = await apiRequest<ExternalTransferPreview>('/api/bank/transfer/preview', {
        method: 'POST',
        body: JSON.stringify({
          ...externalForm,
          amount: Number(externalForm.amount),
          behaviorAnomalyScore: snapshot?.anomalyScore || 0,
          otpRetries: snapshot?.otpFailures || 0,
        }),
      });

      setExternalPreview(response);
      setCooldownRemaining(response.cyberProtection.coolingOffSeconds || 0);
    } catch (err) {
      track('submit_failure', {
        detail: err instanceof Error ? err.message : 'external transfer preview failed',
      });
      setExternalTransferStatus(
        err instanceof Error ? err.message : 'Unable to preview protected transfer.'
      );
    } finally {
      setExternalTransferBusy(false);
    }
  };

  const initiateExternalTransfer = async () => {
    setExternalOtpBusy(true);
    setExternalTransferStatus('');
    track('otp_request', { detail: 'external transfer otp request' });

    try {
      const response = await apiRequest<{
        requiresOtp?: boolean;
        otpSent?: boolean;
        alerts?: string[];
      }>('/api/bank/transfer', {
        method: 'POST',
        body: JSON.stringify({
          beneficiaryName: externalForm.beneficiaryName,
          beneficiaryAccount: externalForm.beneficiaryAccount,
          ifsc: externalForm.ifsc,
          bankName: externalForm.bankName,
          amount: Number(externalForm.amount),
          category: externalForm.category,
          note: externalForm.note,
          channel: externalForm.channel,
        }),
      });

      setExternalTransferStatus(
        response.requiresOtp || response.otpSent
          ? 'OTP sent. Please verify to complete the transfer.'
          : 'Transfer completed with the current protection decision.'
      );
    } catch (err) {
      track('otp_failure', {
        detail: err instanceof Error ? err.message : 'external transfer initiation failed',
      });
      setExternalTransferStatus(
        err instanceof Error ? err.message : 'Unable to initiate transfer.'
      );
    } finally {
      setExternalOtpBusy(false);
    }
  };

  const verifyExternalOtp = async () => {
    setExternalTransferBusy(true);
    setExternalTransferStatus('');
    track('otp_attempt', { detail: 'external transfer otp verify' });

    try {
      await apiRequest('/api/bank/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ otp: externalForm.otp }),
      });

      window.dispatchEvent(new Event('legend-security-refresh'));
      setExternalTransferStatus(
        'Protected transfer completed. Funds moved only after intelligence and protection checks.'
      );
    } catch (err) {
      track('otp_failure', {
        detail: err instanceof Error ? err.message : 'external transfer otp verify failed',
      });
      setExternalTransferStatus(
        err instanceof Error ? err.message : 'Unable to verify transfer OTP.'
      );
    } finally {
      setExternalTransferBusy(false);
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
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full bg-muted px-4 py-2 text-sm text-foreground">
                {connections.length}/3 connected
              </div>
              <Button variant="outline" className="gap-2" onClick={openExternalTransferDialog}>
                <Send className="h-4 w-4" />
                Protected External Transfer
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={openInternalTransferDialog}
                disabled={connections.length < 2}
              >
                <ArrowRightLeft className="h-4 w-4" />
                Smart Internal Transfer
              </Button>
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
                          {bank.bankName} | {bank.accountNumberMasked}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {bank.accountType} | IFSC {bank.ifsc}
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
                          {connection.isPrimary ? ' | Primary' : ''}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {connection.dataset.bankName} | {connection.dataset.accountNumberMasked}
                        </p>
                        <p className="mt-2 text-sm text-foreground">
                          Available balance: Rs.{connection.currentBalance.toLocaleString('en-IN')}
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

        <Dialog open={internalTransferOpen} onOpenChange={setInternalTransferOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Smart Internal Transfer</DialogTitle>
              <DialogDescription>
                We do not just enable transfers. We evaluate their financial impact and risk before allowing them.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">From</label>
                  <select
                    value={internalTransferForm.fromConnectionId}
                    onChange={(event) =>
                      setInternalTransferForm((current) => ({
                        ...current,
                        fromConnectionId: event.target.value,
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select source account</option>
                    {connections.map((connection) => (
                      <option key={connection.id} value={connection.id}>
                        {connection.alias} ({connection.dataset.accountNumberMasked})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">To</label>
                  <select
                    value={internalTransferForm.toConnectionId}
                    onChange={(event) =>
                      setInternalTransferForm((current) => ({
                        ...current,
                        toConnectionId: event.target.value,
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select destination account</option>
                    {connections.map((connection) => (
                      <option key={connection.id} value={connection.id}>
                        {connection.alias} ({connection.dataset.accountNumberMasked})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Amount</label>
                  <Input
                    type="number"
                    min="1"
                    value={internalTransferForm.amount}
                    onChange={(event) =>
                      setInternalTransferForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                    placeholder="50000"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={previewInternalTransfer} disabled={internalTransferBusy}>
                  {internalTransferBusy ? 'Analyzing...' : 'Preview Transfer'}
                </Button>
                <Button variant="outline" onClick={sendInternalOtp} disabled={internalOtpBusy}>
                  {internalOtpBusy ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </div>

              {internalPreview && (
                <div className="space-y-4">
                  <Card className="p-4">
                    <h3 className="font-semibold text-foreground">Wealth Intelligence Layer</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {internalPreview.wealthIntelligence.headline}
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-xl bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Source after transfer</p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                          Rs.{internalPreview.wealthIntelligence.sourceBalanceAfter.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <div className="rounded-xl bg-muted/30 p-3">
                        <p className="text-xs text-muted-foreground">Destination after transfer</p>
                        <p className="mt-1 text-lg font-semibold text-foreground">
                          Rs.{internalPreview.wealthIntelligence.destinationBalanceAfter.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-foreground">
                      This transfer will reduce your savings by {internalPreview.wealthIntelligence.savingsImpactPercent}%.
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      AI note: {internalPreview.wealthIntelligence.aiRecommendation}
                    </p>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold text-foreground">Cyber Protection Layer</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                        Risk score {internalPreview.cyberProtection.riskScore}
                      </span>
                      <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
                        {internalPreview.cyberProtection.riskLevel}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          internalPreview.decision === 'allow'
                            ? 'bg-success/10 text-success'
                            : internalPreview.decision === 'warn'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        Decision: {internalPreview.decision}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2">
                      {internalPreview.cyberProtection.reasons.map((reason) => (
                        <p key={reason} className="text-sm text-muted-foreground">
                          {reason}
                        </p>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">4-digit PIN</label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={internalTransferForm.pin}
                    onChange={(event) =>
                      setInternalTransferForm((current) => ({
                        ...current,
                        pin: event.target.value.replace(/\D/g, '').slice(0, 4),
                      }))
                    }
                    placeholder="Enter PIN"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">6-digit OTP</label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={internalTransferForm.otp}
                    onChange={(event) =>
                      setInternalTransferForm((current) => ({
                        ...current,
                        otp: event.target.value.replace(/\D/g, '').slice(0, 6),
                      }))
                    }
                    placeholder="Enter OTP"
                  />
                </div>
              </div>

              {internalTransferStatus && (
                <p className="text-sm text-foreground">{internalTransferStatus}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  track('dialog_close', { detail: 'internal transfer dialog' });
                  setInternalTransferOpen(false);
                }}
              >
                Close
              </Button>
              <Button onClick={executeInternalTransfer} disabled={internalTransferBusy}>
                {internalTransferBusy ? 'Executing...' : 'Execute Transfer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={externalTransferOpen} onOpenChange={setExternalTransferOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Protected External Transfer</DialogTitle>
              <DialogDescription>
                Detect if this is a mistake or fraud before money leaves your account.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Account holder name</label>
                  <Input
                    value={externalForm.beneficiaryName}
                    onChange={(event) =>
                      setExternalForm((current) => ({
                        ...current,
                        beneficiaryName: event.target.value,
                      }))
                    }
                    placeholder="Beneficiary name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Account number</label>
                  <Input
                    value={externalForm.beneficiaryAccount}
                    onChange={(event) =>
                      setExternalForm((current) => ({
                        ...current,
                        beneficiaryAccount: event.target.value.replace(/\D/g, ''),
                      }))
                    }
                    placeholder="Beneficiary account number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">IFSC code</label>
                  <Input
                    value={externalForm.ifsc}
                    onChange={(event) =>
                      setExternalForm((current) => ({
                        ...current,
                        ifsc: event.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="PSIB0000001"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Bank name</label>
                  <Input
                    value={externalForm.bankName}
                    onChange={(event) =>
                      setExternalForm((current) => ({
                        ...current,
                        bankName: event.target.value,
                      }))
                    }
                    placeholder="Beneficiary bank"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Amount</label>
                  <Input
                    type="number"
                    min="1"
                    value={externalForm.amount}
                    onChange={(event) =>
                      setExternalForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Transfer mode</label>
                  <select
                    value={externalForm.channel}
                    onChange={(event) =>
                      setExternalForm((current) => ({
                        ...current,
                        channel: event.target.value,
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="NEFT">NEFT</option>
                    <option value="IMPS">IMPS</option>
                    <option value="RTGS">RTGS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Purpose</label>
                  <select
                    value={externalForm.category}
                    onChange={(event) =>
                      setExternalForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Rent">Rent</option>
                    <option value="Investment">Investment</option>
                    <option value="Gift">Gift</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Note</label>
                  <Input
                    value={externalForm.note}
                    onChange={(event) =>
                      setExternalForm((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    placeholder="Optional note"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={previewExternalTransfer} disabled={externalTransferBusy}>
                  {externalTransferBusy ? 'Analyzing...' : 'Analyze Transfer'}
                </Button>
                <Button
                  variant="outline"
                  onClick={initiateExternalTransfer}
                  disabled={
                    externalOtpBusy ||
                    !externalPreview ||
                    externalPreview.cyberProtection.decision === 'block' ||
                    cooldownRemaining > 0
                  }
                >
                  {externalOtpBusy ? 'Starting...' : 'Proceed With OTP'}
                </Button>
              </div>

              {externalPreview && (
                <div className="space-y-4">
                  <Card className="p-4">
                    <h3 className="font-semibold text-foreground">Wealth Intelligence</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      This transfer will reduce available savings by {externalPreview.wealthIntelligence.savingsImpactPercent}%.
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {externalPreview.wealthIntelligence.goalImpact}
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      AI note: {externalPreview.wealthIntelligence.aiRecommendation}
                    </p>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold text-foreground">Cyber Protection</h3>
                    <p className="mt-2 text-sm text-foreground">
                      {externalPreview.cyberProtection.calmMessage}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                        Risk score {externalPreview.cyberProtection.riskScore}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          externalPreview.cyberProtection.decision === 'allow'
                            ? 'bg-success/10 text-success'
                            : externalPreview.cyberProtection.decision === 'warn'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-destructive/10 text-destructive'
                        }`}
                      >
                        {externalPreview.cyberProtection.decision}
                      </span>
                      <span className="rounded-full bg-secondary/20 px-3 py-1 text-xs font-medium text-foreground">
                        New beneficiary: {externalPreview.beneficiary.isNewBeneficiary ? 'Yes' : 'No'}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {externalPreview.cyberProtection.explainability.map((item) => (
                        <div key={item.label} className="rounded-xl bg-muted/30 p-3">
                          <p className="text-sm font-medium text-foreground">
                            {item.label} (+{item.points})
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
                        </div>
                      ))}
                    </div>

                    {cooldownRemaining > 0 && (
                      <p className="mt-4 text-sm text-warning">
                        Calm review in progress. Please wait {cooldownRemaining}s before proceeding.
                      </p>
                    )}
                  </Card>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">6-digit OTP</label>
                <Input
                  value={externalForm.otp}
                  onChange={(event) =>
                    setExternalForm((current) => ({
                      ...current,
                      otp: event.target.value.replace(/\D/g, '').slice(0, 6),
                    }))
                  }
                  placeholder="Enter OTP after initiation"
                />
              </div>

              {externalTransferStatus && (
                <p className="text-sm text-foreground">{externalTransferStatus}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  track('dialog_close', { detail: 'external transfer dialog' });
                  setExternalTransferOpen(false);
                }}
              >
                Close
              </Button>
              <Button
                onClick={verifyExternalOtp}
                disabled={externalTransferBusy || externalForm.otp.length !== 6}
              >
                {externalTransferBusy ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
