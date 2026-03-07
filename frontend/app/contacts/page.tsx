'use client';

import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trustedContactsData } from '@/lib/mock-data';
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  Mail,
  Phone,
  Eye,
  AlertCircle,
} from 'lucide-react';

const permissionIcons = {
  view: <Eye className="h-4 w-4" />,
  emergency: <AlertCircle className="h-4 w-4" />,
};

export default function ContactsPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Trusted Contacts
            </h1>
            <p className="text-muted-foreground">
              Manage people who can access your account in emergencies
            </p>
          </div>
          <Button className="gap-2 bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Add Contact
          </Button>
        </div>

        {/* Information Card */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            What are Trusted Contacts?
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Trusted Contacts are people you designate to help manage your account in case of emergency.
            They can access specific information or take actions based on the permissions you grant.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-primary">•</span>
              <span>View permission allows access to account overview</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="text-primary">•</span>
              <span>Emergency permission enables critical account actions</span>
            </div>
          </div>
        </Card>

        {/* Contacts List */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Your Contacts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trustedContactsData.map((contact) => (
              <Card key={contact.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {contact.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {contact.relationship}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground hover:text-inherit">
                      {contact.email}
                    </span>
                  </a>
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground hover:text-inherit">
                      {contact.phone}
                    </span>
                  </a>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold tracking-wide">
                    Permissions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {contact.permissions.map((perm) => (
                      <div
                        key={perm}
                        className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                      >
                        {permissionIcons[perm as keyof typeof permissionIcons]}
                        <span className="capitalize">{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Guidelines */}
        <Card className="p-6 border-warning/50 bg-warning/5">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Best Practices
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1 flex-shrink-0">✓</span>
              <span className="text-muted-foreground">
                Choose people you trust completely and who understand your financial situation
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1 flex-shrink-0">✓</span>
              <span className="text-muted-foreground">
                Ensure contacts have reliable contact information on file
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1 flex-shrink-0">✓</span>
              <span className="text-muted-foreground">
                Review permissions periodically and update as needed
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-primary mt-1 flex-shrink-0">✓</span>
              <span className="text-muted-foreground">
                Keep contact information current by notifying us of changes
              </span>
            </li>
          </ul>
        </Card>
      </div>
    </MainLayout>
  );
}
