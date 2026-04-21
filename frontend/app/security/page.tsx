'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/main-layout';
import { Card } from '@/components/ui/card';
import {
  UserPlus,
  TrendingUp,
  BarChart3,
  Target,
  CheckCircle,
  Shield,
  Lock,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  UserPlus: <UserPlus className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  BarChart3: <BarChart3 className="h-5 w-5" />,
  Target: <Target className="h-5 w-5" />,
  CheckCircle: <CheckCircle className="h-5 w-5" />,
};

export default function SecurityPage() {

  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchSecurityEvents = async () => {

      try {

        const token = localStorage.getItem("accessToken");

        const res = await fetch(
          "http://localhost:5000/api/transaction/history",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const text = await res.text();
        console.log(text);
        const data = JSON.parse(text);

        const events = data.map((tx:any) => ({
          title: tx.type || "Transaction",
          description: tx.description || "Financial activity recorded",
          date: tx.date || new Date().toISOString(),
          icon: "TrendingUp"
        }));

        setTimelineData(events);

      } catch (err) {
        console.error("Failed to fetch security timeline", err);
      }

      setLoading(false);

    };

    fetchSecurityEvents();

  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">Loading security timeline...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>

      <div className="space-y-8">

        {/* Header */}

        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Security Timeline
          </h1>
          <p className="text-muted-foreground">
            Account activity and security events
          </p>
        </div>

        {/* Security Status */}

        <Card className="p-6 bg-success/5 border-success/20">

          <div className="flex items-start gap-4">

            <div className="w-12 h-12 rounded-lg bg-success/20 flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 text-success" />
            </div>

            <div>

              <h2 className="font-semibold text-foreground mb-1">
                Your account is secure
              </h2>

              <p className="text-sm text-muted-foreground">
                All security measures are enabled and up to date
              </p>

            </div>

          </div>

        </Card>

        {/* Timeline */}

        <div>

          <h2 className="text-lg font-semibold text-foreground mb-4">
            Activity Timeline
          </h2>

          <div className="space-y-4">

            {timelineData.map((event, index) => (

              <div key={index} className="flex gap-4">

                <div className="flex flex-col items-center gap-2">

                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">

                    {iconMap[event.icon] || <CheckCircle className="h-5 w-5" />}

                  </div>

                  {index < timelineData.length - 1 && (
                    <div className="w-0.5 h-12 bg-border" />
                  )}

                </div>

                <Card className="p-4 flex-1">

                  <div className="flex items-start justify-between mb-2">

                    <h3 className="font-semibold text-foreground">
                      {event.title}
                    </h3>

                    <span className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleDateString()}
                    </span>

                  </div>

                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>

                </Card>

              </div>

            ))}

          </div>

        </div>

        {/* Security Features */}

        <Card className="p-6">

          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Security Features
          </h2>

          <div className="space-y-3">

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="font-medium text-foreground">
                Two-Factor Authentication
              </span>
              <span className="text-xs font-semibold text-success uppercase">
                Enabled
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="font-medium text-foreground">
                Biometric Login
              </span>
              <span className="text-xs font-semibold text-success uppercase">
                Enabled
              </span>
            </div>

          </div>

        </Card>

      </div>

    </MainLayout>
  );
}