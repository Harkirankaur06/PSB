'use client';

import { useCallback, useEffect, useState } from 'react';

export type BehaviorEventType =
  | 'field_change'
  | 'field_correction'
  | 'password_toggle'
  | 'submit_attempt'
  | 'submit_failure'
  | 'otp_request'
  | 'otp_attempt'
  | 'otp_failure'
  | 'dialog_open'
  | 'dialog_close'
  | 'safe_exit'
  | 'duress_signal'
  | 'trusted_contact_review'
  | 'rapid_retry';

export interface BehaviorEvent {
  source: string;
  type: BehaviorEventType;
  field?: string;
  detail?: string;
  timestamp: number;
}

export interface BehaviorSnapshot {
  totalEvents: number;
  recentEvents: BehaviorEvent[];
  submitAttempts: number;
  submitFailures: number;
  otpAttempts: number;
  otpFailures: number;
  correctionCount: number;
  passwordRevealCount: number;
  dialogToggleCount: number;
  rapidRetryCount: number;
  duressSignals: number;
  trustedContactReviews: number;
  safeExits: number;
  anomalyScore: number;
  anomalyLevel: 'low' | 'medium' | 'high';
}

const EVENTS_KEY = 'legend.behavior.events';
const DURESS_KEY = 'legend.security.duress';
const MAX_EVENTS = 80;
const RAPID_WINDOW_MS = 12000;

function canUseStorage() {
  return typeof window !== 'undefined';
}

function readEvents(): BehaviorEvent[] {
  if (!canUseStorage()) {
    return [];
  }

  const raw = window.sessionStorage.getItem(EVENTS_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as BehaviorEvent[];
  } catch {
    return [];
  }
}

function writeEvents(events: BehaviorEvent[]) {
  if (!canUseStorage()) {
    return;
  }

  window.sessionStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
}

export function recordBehaviorEvent(event: Omit<BehaviorEvent, 'timestamp'>) {
  const events = readEvents();
  writeEvents([
    ...events,
    {
      ...event,
      timestamp: Date.now(),
    },
  ]);
}

export function setDuressProtection(active: boolean) {
  if (!canUseStorage()) {
    return;
  }

  if (active) {
    window.sessionStorage.setItem(DURESS_KEY, 'active');
    recordBehaviorEvent({
      source: 'security',
      type: 'duress_signal',
      detail: 'Silent review mode enabled',
    });
    return;
  }

  window.sessionStorage.removeItem(DURESS_KEY);
}

export function getDuressProtectionState() {
  if (!canUseStorage()) {
    return false;
  }

  return window.sessionStorage.getItem(DURESS_KEY) === 'active';
}

export function getBehaviorSnapshot(): BehaviorSnapshot {
  const events = readEvents();
  const now = Date.now();
  const recentEvents = events.slice(-12).reverse();
  const rapidRetryCount = events.filter(
    (event) =>
      (event.type === 'submit_failure' || event.type === 'otp_failure') &&
      now - event.timestamp <= RAPID_WINDOW_MS
  ).length;

  const submitAttempts = events.filter((event) => event.type === 'submit_attempt').length;
  const submitFailures = events.filter((event) => event.type === 'submit_failure').length;
  const otpAttempts = events.filter((event) => event.type === 'otp_attempt').length;
  const otpFailures = events.filter((event) => event.type === 'otp_failure').length;
  const correctionCount = events.filter((event) => event.type === 'field_correction').length;
  const passwordRevealCount = events.filter((event) => event.type === 'password_toggle').length;
  const dialogToggleCount = events.filter(
    (event) => event.type === 'dialog_open' || event.type === 'dialog_close'
  ).length;
  const duressSignals = events.filter((event) => event.type === 'duress_signal').length;
  const trustedContactReviews = events.filter(
    (event) => event.type === 'trusted_contact_review'
  ).length;
  const safeExits = events.filter((event) => event.type === 'safe_exit').length;

  const anomalyScore = Math.min(
    100,
    submitFailures * 12 +
      otpFailures * 10 +
      correctionCount * 4 +
      passwordRevealCount * 3 +
      dialogToggleCount * 2 +
      rapidRetryCount * 15 +
      duressSignals * 28 +
      trustedContactReviews * 8 +
      safeExits * 18
  );

  return {
    totalEvents: events.length,
    recentEvents,
    submitAttempts,
    submitFailures,
    otpAttempts,
    otpFailures,
    correctionCount,
    passwordRevealCount,
    dialogToggleCount,
    rapidRetryCount,
    duressSignals,
    trustedContactReviews,
    safeExits,
    anomalyScore,
    anomalyLevel: anomalyScore >= 60 ? 'high' : anomalyScore >= 30 ? 'medium' : 'low',
  };
}

export function useBehaviorMonitor(source: string) {
  const [snapshot, setSnapshot] = useState<BehaviorSnapshot | null>(null);

  const refresh = useCallback(() => {
    setSnapshot(getBehaviorSnapshot());
  }, []);

  const track = useCallback(
    (
      type: BehaviorEventType,
      payload: Omit<BehaviorEvent, 'source' | 'type' | 'timestamp'> = {}
    ) => {
      recordBehaviorEvent({
        source,
        type,
        ...payload,
      });
      refresh();
    },
    [refresh, source]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    snapshot,
    refresh,
    track,
    duressActive: getDuressProtectionState(),
    setDuressProtection,
  };
}
