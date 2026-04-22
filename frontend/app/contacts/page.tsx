'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

interface Contact {
  _id: string;
  name: string;
  relationship: string;
  email: string;
  phone: string;
  permissions: string[];
}

const permissionIcons = {
  view: <Eye className="h-4 w-4" />,
  emergency: <AlertCircle className="h-4 w-4" />,
};

export default function ContactsPage() {

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = async () => {

    try {

      const token = localStorage.getItem("accessToken");

      const res = await fetch(
        "https://psb-backend.onrender.com/api/security/trusted-contacts",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const text = await res.text();
      console.log(text);
      const data = JSON.parse(text);
      setContacts(data);

    } catch (err) {

      console.error("Failed to fetch contacts", err);

    }

    setLoading(false);

  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const deleteContact = async (id: string) => {

    try {

      const token = localStorage.getItem("accessToken");

      await fetch(
        `https://psb-backend.onrender.com/api/security/trusted-contacts/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      fetchContacts();

    } catch (err) {

      console.error("Delete contact failed", err);

    }

  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">Loading contacts...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>

      <div className="space-y-8">

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

        <Card className="p-6 bg-primary/5 border-primary/20">

          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            What are Trusted Contacts?
          </h2>

          <p className="text-sm text-muted-foreground">
            Trusted Contacts are people who can access your account during emergencies.
          </p>

        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {contacts.map((contact) => (

            <Card key={contact._id} className="p-6">

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