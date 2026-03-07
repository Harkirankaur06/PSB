'use client';

import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  User,
  Lock,
  Bell,
  Eye,
  LogOut,
  ChevronRight,
  Toggle,
} from 'lucide-react';

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account preferences and security
          </p>
        </div>

        {/* Profile Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                First Name
              </label>
              <Input
                type="text"
                defaultValue="John"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Last Name
              </label>
              <Input
                type="text"
                defaultValue="Doe"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <Input
                type="email"
                defaultValue="john.doe@email.com"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <Input
                type="tel"
                defaultValue="+1 (555) 123-4567"
                className="w-full"
              />
            </div>
          </div>
          <Button className="mt-6 bg-primary hover:bg-primary/90">
            Save Changes
          </Button>
        </Card>

        {/* Security Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Security & Privacy
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <h3 className="font-medium text-foreground">Password</h3>
                <p className="text-sm text-muted-foreground">
                  Last updated 3 months ago
                </p>
              </div>
              <Button variant="outline" size="sm">
                Change
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <h3 className="font-medium text-foreground">
                  Two-Factor Authentication
                </h3>
                <p className="text-sm text-muted-foreground">
                  Adds extra security to your account
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-success uppercase">
                  Enabled
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <h3 className="font-medium text-foreground">Biometric Login</h3>
                <p className="text-sm text-muted-foreground">
                  Sign in with fingerprint or Face ID
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-success uppercase">
                  Enabled
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <h3 className="font-medium text-foreground">Session Timeout</h3>
                <p className="text-sm text-muted-foreground">
                  Automatically logout after inactivity
                </p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </h2>
          <div className="space-y-4">
            {[
              {
                title: 'Large Transactions',
                description: 'Notify when transactions exceed $5,000',
              },
              {
                title: 'Portfolio Alerts',
                description: 'Daily updates on significant portfolio changes',
              },
              {
                title: 'Goal Progress',
                description: 'Monthly updates on your financial goals',
              },
              {
                title: 'Security Events',
                description: 'Alerts for login attempts and account changes',
              },
            ].map((notif, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
              >
                <div>
                  <h3 className="font-medium text-foreground">{notif.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {notif.description}
                  </p>
                </div>
                <div className="w-12 h-7 rounded-full bg-primary/30 relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-5 h-5 rounded-full bg-primary"></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Privacy & Data
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <h3 className="font-medium text-foreground">
                  Download Your Data
                </h3>
                <p className="text-sm text-muted-foreground">
                  Export your personal and financial data
                </p>
              </div>
              <Button variant="outline" size="sm">
                Download
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <h3 className="font-medium text-foreground">
                  Marketing Communications
                </h3>
                <p className="text-sm text-muted-foreground">
                  Receive updates about new features
                </p>
              </div>
              <div className="w-12 h-7 rounded-full bg-primary/30 relative cursor-pointer">
                <div className="absolute right-1 top-1 w-5 h-5 rounded-full bg-primary"></div>
              </div>
            </div>
          </div>
        </Card>

        {/* Account Actions */}
        <Card className="p-6 border-destructive/50 bg-destructive/5">
          <h2 className="text-lg font-semibold text-foreground mb-6">
            Account Management
          </h2>
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between"
            >
              <span>Sign Out All Devices</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between text-destructive"
            >
              <span>Delete Account</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Help & Support */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">
            Help & Support
          </h2>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-between">
              <span>Contact Support</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              <span>View Documentation</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              <span>FAQ</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
