'use client';

import { MainLayout } from '@/components/main-layout';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Star, ArrowRight, Filter } from 'lucide-react';
import { AppOverview, useAppOverview, useFormattedCurrency } from '@/lib/app-data';
import { apiRequest } from '@/lib/api-client';

const OpportunityCard = ({
  opportunity,
  onOpen,
}: {
  opportunity: AppOverview['opportunities'][number];
  onOpen: (opportunity: AppOverview['opportunities'][number]) => void;
}) => {
  const formatCurrency = useFormattedCurrency();

  const riskColors = {
    low: 'bg-green-500/20 text-green-600',
    moderate: 'bg-yellow-500/20 text-yellow-600',
    high: 'bg-red-500/20 text-red-600',
  };

  const fundProgress = (opportunity.fundRaised / Math.max(opportunity.fundSize, 1)) * 100;

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">{opportunity.name}</h3>
            {opportunity.featured && <Star className="h-5 w-5 text-secondary fill-secondary" />}
          </div>
          <p className="text-sm text-muted-foreground mt-1">{opportunity.category}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskColors[opportunity.riskLevel]}`}>
          {opportunity.riskLevel.charAt(0).toUpperCase() + opportunity.riskLevel.slice(1)} Risk
        </span>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{opportunity.description}</p>

      <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground">Expected Return</p>
          <p className="text-lg font-semibold text-primary">{opportunity.expectedReturn}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Min. Investment</p>
          <p className="text-lg font-semibold text-foreground">
            {formatCurrency(opportunity.minimumInvestment)}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">Fund Progress</p>
          <p className="text-xs font-medium text-foreground">{fundProgress.toFixed(0)}%</p>
        </div>
        <div className="w-full h-2 bg-secondary/20 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: `${fundProgress}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {formatCurrency(opportunity.fundRaised)} of {formatCurrency(opportunity.fundSize)}
        </p>
      </div>

      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <p className="text-xs text-muted-foreground">
          {opportunity.investorCount.toLocaleString()} investors
        </p>
        <p className="text-xs text-muted-foreground">Source: {opportunity.source}</p>
      </div>

      <Button
        className="w-full gap-2 group-hover:translate-x-1 transition-transform"
        onClick={() => onOpen(opportunity)}
      >
        Open Order Ticket
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default function InvestPage() {
  const { data, loading, error, setData } = useAppOverview();
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderStatus, setOrderStatus] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<AppOverview['opportunities'][number] | null>(null);
  const [orderForm, setOrderForm] = useState({
    amount: '',
    type: 'invest',
    goalId: '',
    pin: '',
    otp: '',
    notes: '',
  });
  const formatCurrency = useFormattedCurrency();

  const refreshOverview = async () => {
    const overview = await apiRequest<AppOverview>('/api/app/overview');
    setData(overview);
    window.dispatchEvent(new Event('legend-security-refresh'));
  };

  const openOrderTicket = (opportunity: AppOverview['opportunities'][number]) => {
    setSelectedOpportunity(opportunity);
    setOrderStatus('');
    setOtpSent(false);
    setOrderForm({
      amount: String(opportunity.minimumInvestment),
      type: opportunity.category.toLowerCase().includes('sip') ? 'sip' : 'invest',
      goalId: data?.goals[0]?.id || '',
      pin: '',
      otp: '',
      notes: '',
    });
    setOrderOpen(true);
  };

  const sendOrderOtp = async () => {
    setOtpLoading(true);
    setOrderStatus('');

    try {
      const response = await apiRequest<{ deliveryMode: string }>('/api/security/transaction-otp/send', {
        method: 'POST',
      });
      setOtpSent(true);
      setOrderStatus(
        response.deliveryMode === 'smtp'
          ? 'OTP sent for transaction approval.'
          : 'OTP generated in fallback mode. Check backend logs if email is not configured.'
      );
    } catch (err) {
      setOrderStatus(err instanceof Error ? err.message : 'Unable to send transaction OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const submitOrder = async () => {
    if (!selectedOpportunity) {
      return;
    }

    const amount = Number(orderForm.amount);
    if (!amount || amount < selectedOpportunity.minimumInvestment) {
      setOrderStatus(
        `Enter an amount of at least ${formatCurrency(selectedOpportunity.minimumInvestment)}.`
      );
      return;
    }

    if (orderForm.pin.length !== 4 || orderForm.otp.length !== 6) {
      setOrderStatus('Enter your 4-digit PIN and 6-digit OTP to confirm this investment.');
      return;
    }

    setSubmitting(true);
    setOrderStatus('');

    try {
      const endpoint =
        orderForm.type === 'sip'
          ? '/api/transaction/sip'
          : orderForm.type === 'rebalance'
            ? '/api/transaction'
            : '/api/transaction/invest';
      const response = await apiRequest<{
        decision: string;
        riskScore: number;
        transaction: {
          status: string;
          metadata?: {
            execution?: {
              mode?: string;
            };
          };
        };
      }>(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          type: orderForm.type,
          amount,
          metadata: {
            opportunityId: selectedOpportunity.id,
            opportunityName: selectedOpportunity.name,
            category: selectedOpportunity.category,
            notes: orderForm.notes,
            goalId: orderForm.goalId || undefined,
            security: {
              pin: orderForm.pin,
              otp: orderForm.otp,
            },
          },
        }),
      });

      await refreshOverview();

      const executionMode =
        response.transaction.metadata?.execution?.mode === 'live-ready'
          ? 'live-ready'
          : 'simulated';

      setOrderStatus(
        response.transaction.status === 'completed'
          ? `Investment submitted successfully. Execution mode: ${executionMode}.`
          : response.transaction.status === 'warning'
            ? 'Investment entered review and will complete after the protection delay.'
            : 'Investment was blocked by the protection engine. Review security inputs and try again.'
      );

      if (response.transaction.status === 'completed' || response.transaction.status === 'warning') {
        setOtpSent(false);
        setOrderForm((current) => ({ ...current, pin: '', otp: '', notes: '' }));
      }
    } catch (err) {
      setOrderStatus(err instanceof Error ? err.message : 'Unable to submit investment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">Loading investment opportunities...</div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="p-8">{error || 'Unable to load opportunities.'}</div>
      </MainLayout>
    );
  }

  const opportunities = data.opportunities;
  const filteredOpportunities = opportunities.filter((opp) => {
    if (selectedRisk && opp.riskLevel !== selectedRisk) return false;
    if (selectedCategory && opp.category !== selectedCategory) return false;
    return true;
  });

  const categories = [...new Set(opportunities.map((opportunity) => opportunity.category))];
  const riskLevels = ['low', 'moderate', 'high'];

  return (
    <MainLayout>
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Investment Opportunities</h1>
          <p className="text-muted-foreground">
            AI-ranked opportunities blended with your current goals and cyber posture
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Market Pulse</h2>
                <p className="text-sm text-muted-foreground">{data.market.headline}</p>
              </div>
              <span className="text-xs text-muted-foreground uppercase">
                Source: {data.market.source}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {data.market.indicators.map((indicator) => (
                <div key={indicator.code} className="rounded-lg border border-border p-4 bg-muted/20">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {indicator.name}
                  </p>
                  <p className="text-2xl font-semibold text-foreground mt-1">
                    {indicator.category === 'rates' || indicator.category === 'macro'
                      ? indicator.value
                      : formatCurrency(indicator.value)}
                  </p>
                  <p
                    className={`text-sm mt-1 ${
                      indicator.changePercent > 0
                        ? 'text-green-600'
                        : indicator.changePercent < 0
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {indicator.changePercent > 0 ? '+' : ''}
                    {indicator.changePercent}% vs recent close
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">AI Strategy Notes</h2>
            <div className="space-y-3">
              {data.market.recommendations.map((item, index) => (
                <div key={`${item}-${index}`} className="rounded-lg border border-border p-3 bg-muted/20">
                  <p className="text-sm text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Filters</h3>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-foreground mb-3">Risk Level</p>
                <div className="space-y-2">
                  {riskLevels.map((level) => (
                    <button
                      key={level}
                      onClick={() => setSelectedRisk(selectedRisk === level ? null : level)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedRisk === level
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/10 text-foreground hover:bg-secondary/20'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-3">Category</p>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() =>
                        setSelectedCategory(selectedCategory === category ? null : category)
                      }
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === category
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/10 text-foreground hover:bg-secondary/20'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {(selectedRisk || selectedCategory) && (
                <Button
                  variant="ghost"
                  className="w-full text-primary hover:text-primary"
                  onClick={() => {
                    setSelectedRisk(null);
                    setSelectedCategory(null);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="grid grid-cols-1 gap-6">
              {filteredOpportunities.length > 0 ? (
                filteredOpportunities.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    onOpen={openOrderTicket}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No opportunities match your filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={orderOpen} onOpenChange={setOrderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedOpportunity?.name || 'Order ticket'}</DialogTitle>
            <DialogDescription>
              Confirm amount, request a transaction OTP, then submit with your PIN and OTP.
            </DialogDescription>
          </DialogHeader>

          {selectedOpportunity && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">{selectedOpportunity.category}</p>
                    <p className="text-xs text-muted-foreground">
                      Expected return {selectedOpportunity.expectedReturn}% | Min. investment{' '}
                      {formatCurrency(selectedOpportunity.minimumInvestment)}
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    Execution: simulated now, live-ready later
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Order type</label>
                  <select
                    value={orderForm.type}
                    onChange={(event) =>
                      setOrderForm((current) => ({ ...current, type: event.target.value }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="invest">Direct invest</option>
                    <option value="sip">SIP</option>
                    <option value="rebalance">Rebalance</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground">Amount</label>
                  <Input
                    type="number"
                    min={selectedOpportunity.minimumInvestment}
                    value={orderForm.amount}
                    onChange={(event) =>
                      setOrderForm((current) => ({ ...current, amount: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Link to goal</label>
                <select
                  value={orderForm.goalId}
                  onChange={(event) =>
                    setOrderForm((current) => ({ ...current, goalId: event.target.value }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Do not link to a goal</option>
                  {data.goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Notes</label>
                <Input
                  value={orderForm.notes}
                  onChange={(event) =>
                    setOrderForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Optional note for this order"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={orderForm.otp}
                  onChange={(event) =>
                    setOrderForm((current) => ({
                      ...current,
                      otp: event.target.value.replace(/\D/g, '').slice(0, 6),
                    }))
                  }
                  placeholder="6-digit OTP"
                />
                <Button variant="outline" onClick={sendOrderOtp} disabled={otpLoading}>
                  {otpLoading ? 'Sending OTP...' : otpSent ? 'Resend OTP' : 'Send OTP'}
                </Button>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">4-digit PIN</label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={orderForm.pin}
                  onChange={(event) =>
                    setOrderForm((current) => ({
                      ...current,
                      pin: event.target.value.replace(/\D/g, '').slice(0, 4),
                    }))
                  }
                  placeholder="Enter PIN"
                />
              </div>

              {orderStatus && <p className="text-sm text-foreground">{orderStatus}</p>}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderOpen(false)}>
              Close
            </Button>
            <Button onClick={submitOrder} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Confirm Investment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
