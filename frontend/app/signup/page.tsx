'use client';

import { useState } from 'react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api-client';

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    duressPassword: '',
    initialBankDatasetId: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPrivateProtection, setShowPrivateProtection] = useState(false);
  const [bankOptions, setBankOptions] = useState<Array<{
    id: string;
    displayName: string;
    bankName: string;
    accountNumberMasked: string;
  }>>([]);

  useEffect(() => {
    let active = true;

    async function loadBankCatalog() {
      try {
        const response = await apiRequest<Array<{
          id: string;
          displayName: string;
          bankName: string;
          accountNumberMasked: string;
        }>>('/api/bank-link/catalog', {
          auth: false,
        });

        if (!active) {
          return;
        }

        setBankOptions(response);
        setFormData((prev) => ({
          ...prev,
          initialBankDatasetId: prev.initialBankDatasetId || response[0]?.id || '',
        }));
      } catch {
        if (!active) {
          return;
        }

        setBankOptions([]);
      }
    }

    loadBankCatalog();

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (name === 'password') {
      let strength = 0;

      if (value.length >= 8) strength++;
      if (/[A-Z]/.test(value)) strength++;
      if (/[0-9]/.test(value)) strength++;
      if (/[^A-Za-z0-9]/.test(value)) strength++;

      setPasswordStrength(strength);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {

    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await apiRequest('/api/auth/signup', {
        auth: false,
        method: 'POST',
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          password: formData.password,
          duressPassword: formData.duressPassword || undefined,
          initialBankDatasetId: formData.initialBankDatasetId,
        }),
      });

      router.push('/login');

    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">

      <div className="w-full max-w-md">

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">
            L.E.G.E.N.D.
          </h1>
          <p className="text-muted-foreground">
            Create your account to get started
          </p>
        </div>

        <Card className="p-6">

          <form onSubmit={handleSignup} className="space-y-4">

            {error && (
              <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-3 text-destructive">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  First Name
                </label>

                <Input
                  type="text"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Last Name
                </label>

                <Input
                  type="text"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

            </div>

            <div>

              <label className="block text-sm font-medium mb-1.5">
                Email Address
              </label>

              <Input
                type="email"
                name="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />

            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-sm font-medium">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPrivateProtection((current) => !current)}
                >
                  {showPrivateProtection ? 'Hide private protection' : 'Add private protection'}
                </button>
              </div>

              <div className="relative">

                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pr-10"
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>

              </div>

              {formData.password && (

                <div className="mt-2 space-y-1">

                  <div className="flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full ${
                          i < passwordStrength
                            ? 'bg-primary'
                            : 'bg-border'
                        }`}
                      />
                    ))}
                  </div>

                </div>

              )}

            </div>

            {showPrivateProtection && (
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Private access password
                </label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="duressPassword"
                  placeholder="Optional hidden backup password"
                  value={formData.duressPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  This optional secondary password signs you in quietly and places the account in protected mode.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Connect your first bank
              </label>
              <select
                name="initialBankDatasetId"
                value={formData.initialBankDatasetId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    initialBankDatasetId: e.target.value,
                  }))
                }
                disabled={loading || bankOptions.length === 0}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                {bankOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.displayName} • {option.accountNumberMasked}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-muted-foreground">
                New users start with one connected dummy bank. You can add up to 3 later from Bank Connections.
              </p>
            </div>

            <div>

              <label className="block text-sm font-medium mb-1.5">
                Confirm Password
              </label>

              <Input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={loading}
              />

            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>

          </form>

          <div className="mt-6 border-t border-border pt-6">
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>

        </Card>

      </div>

    </div>
  );
}
