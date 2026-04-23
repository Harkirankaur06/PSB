'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Trash2, Users, Mail, Phone, Eye, AlertCircle } from 'lucide-react';
import { AppContact, useAppOverview } from '@/lib/app-data';
import { apiRequest } from '@/lib/api-client';

const permissionIcons = {
  view: <Eye className="h-4 w-4" />,
  emergency: <AlertCircle className="h-4 w-4" />,
};

const EMPTY_FORM = {
  name: '',
  relationship: '',
  email: '',
  phone: '',
};

export default function ContactsPage() {
  const { data, loading, error, setData } = useAppOverview();
  const [draft, setDraft] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const createContact = async () => {
    if (!draft.name || !draft.email) {
      return;
    }

    setSaving(true);
    try {
      const newContact = await apiRequest<AppContact>('/api/app/contacts', {
        method: 'POST',
        body: JSON.stringify({
          ...draft,
          permissions: ['view', 'emergency'],
        }),
      });

      setData((current) =>
        current
          ? {
              ...current,
              contacts: [newContact, ...current.contacts],
            }
          : current
      );
      setDraft(EMPTY_FORM);
    } catch (err) {
      console.error('Failed to create contact', err);
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = async (id: string) => {
    try {
      await apiRequest(`/api/app/contacts/${id}`, { method: 'DELETE' });
      setData((current) =>
        current
          ? {
              ...current,
              contacts: current.contacts.filter((contact) => contact._id !== id),
            }
          : current
      );
    } catch (err) {
      console.error('Delete contact failed', err);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">Loading contacts...</div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="p-8">{error || 'Unable to load trusted contacts.'}</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Trusted Contacts</h1>
            <p className="text-muted-foreground">
              Manage emergency contacts stored in your account
            </p>
          </div>
          <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={createContact}>
            <Plus className="h-4 w-4" />
            {saving ? 'Saving...' : 'Add Contact'}
          </Button>
        </div>

        <Card className="p-6 bg-primary/5 border-primary/20">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            What are Trusted Contacts?
          </h2>
          <p className="text-sm text-muted-foreground">
            Trusted Contacts can help with recovery and emergency coordination when your cyber
            protection flow needs a human fallback.
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Add</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Name"
              value={draft.name}
              onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))}
            />
            <Input
              placeholder="Relationship"
              value={draft.relationship}
              onChange={(e) =>
                setDraft((current) => ({ ...current, relationship: e.target.value }))
              }
            />
            <Input
              placeholder="Email"
              type="email"
              value={draft.email}
              onChange={(e) => setDraft((current) => ({ ...current, email: e.target.value }))}
            />
            <Input
              placeholder="Phone"
              value={draft.phone}
              onChange={(e) => setDraft((current) => ({ ...current, phone: e.target.value }))}
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {data.contacts.map((contact) => (
            <Card key={contact._id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{contact.name}</h3>
                  <p className="text-sm text-muted-foreground">{contact.relationship}</p>
                </div>

                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => deleteContact(contact._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <a
                  href={`mailto:${contact.email}`}
                  className="flex items-center gap-2 text-sm hover:text-primary"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {contact.email}
                </a>
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center gap-2 text-sm hover:text-primary"
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {contact.phone}
                </a>
              </div>

              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2 uppercase font-semibold">
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
    </MainLayout>
  );
}
