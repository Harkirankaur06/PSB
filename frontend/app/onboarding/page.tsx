'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CheckCircle2, Fingerprint, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type OnboardingStep = 'welcome' | 'biometric' | 'pin' | 'complete';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBiometric = () => {
    setLoading(true);
    setTimeout(() => {
      setStep('pin');
      setLoading(false);
    }, 1000);
  };

  const handlePinSubmit = () => {
    setError('');
    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      setError('PIN must be 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    setStep('complete');
  };

  const handleComplete = () => {
    router.push('/dashboard');
  };

  if (step === 'welcome') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
                <Fingerprint className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Secure Your Account</h1>
              <p className="text-muted-foreground">
                Set up biometric authentication and a PIN to protect your financial data
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Biometric Setup</h3>
                  <p className="text-sm text-muted-foreground">
                    Use Face ID or fingerprint for quick access
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Set Your PIN</h3>
                  <p className="text-sm text-muted-foreground">
                    Create a 4-digit PIN as a backup
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleBiometric}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
            >
              {loading ? 'Setting up...' : 'Start Setup'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <div className="mt-6 border-t border-border pt-6">
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/dashboard" className="text-primary hover:underline font-medium">
                  Skip for now
                </Link>
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'biometric') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-full mb-4 animate-pulse">
                <Fingerprint className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Set up Biometric</h1>
              <p className="text-muted-foreground">
                Use your Face ID or fingerprint when prompted
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="p-6 bg-muted/50 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Place your finger on the sensor or look at your device camera
                </p>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-background rounded-lg border-2 border-primary/50 border-dashed">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                This is a mock setup. In a real app, the device would capture your biometric data.
              </p>
            </div>

            <Button
              onClick={() => setStep('pin')}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
            >
              Continue to PIN Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'pin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Set Your PIN</h1>
              <p className="text-muted-foreground">
                Create a 4-digit PIN as a backup authentication method
              </p>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  PIN (4 digits)
                </label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Confirm PIN
                </label>
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-medium text-foreground mb-3">PIN must contain:</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>• Exactly 4 digits</div>
                  <div>• Only numbers (0-9)</div>
                  <div>• Avoid easily guessable numbers like 1234 or 0000</div>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePinSubmit}
              disabled={pin.length !== 4 || confirmPin.length !== 4}
              className="w-full mt-8 bg-primary hover:bg-primary/90 text-primary-foreground h-11"
            >
              Set PIN
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/20 rounded-full mb-4">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">All Set!</h1>
            <p className="text-muted-foreground">
              Your account is now secured with biometric authentication and PIN protection
            </p>
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-foreground text-sm font-medium">Biometric enabled</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-foreground text-sm font-medium">PIN configured</span>
            </div>
          </div>

          <Button
            onClick={handleComplete}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
          >
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Card>
      </div>
    </div>
  );
}
