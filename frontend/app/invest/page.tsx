'use client';

import { MainLayout } from '@/components/main-layout';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { TrendingUp, Star, ArrowRight, Filter } from 'lucide-react';

interface Opportunity {
  id: number;
  name: string;
  category: string;
  description: string;
  expectedReturn: number;
  riskLevel: 'low' | 'moderate' | 'high';
  minimumInvestment: number;
  fundSize: number;
  fundRaised: number;
  investorCount: number;
  featured?: boolean;
}

const OpportunityCard = ({ opportunity }: { opportunity: Opportunity }) => {
  const riskColors = {
    low: 'bg-green-500/20 text-green-600',
    moderate: 'bg-yellow-500/20 text-yellow-600',
    high: 'bg-red-500/20 text-red-600',
  };

  const fundProgress = (opportunity.fundRaised / opportunity.fundSize) * 100;

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
          <p className="text-lg font-semibold text-foreground">${opportunity.minimumInvestment.toLocaleString()}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">Fund Progress</p>
          <p className="text-xs font-medium text-foreground">{fundProgress.toFixed(0)}%</p>
        </div>
        <div className="w-full h-2 bg-secondary/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full"
            style={{ width: `${fundProgress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          ${opportunity.fundRaised.toLocaleString()} of ${opportunity.fundSize.toLocaleString()}
        </p>
      </div>

      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <p className="text-xs text-muted-foreground">{opportunity.investorCount.toLocaleString()} investors</p>
      </div>

      <Button className="w-full gap-2 group-hover:translate-x-1 transition-transform">
        View Details
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default function InvestPage() {

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchInvestments = async () => {
      try {

        const token = localStorage.getItem("accessToken");

        const res = await fetch(
          "http://https://psb-backend.onrender.com/api/transaction/history",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const text = await res.text();
        console.log(text);
        const data = JSON.parse(text);

        setOpportunities(data);

      } catch (err) {
        console.error("Error fetching investments", err);
      }

      setLoading(false);
    };

    fetchInvestments();

  }, []);

  if (loading) {
    return (
      <MainLayout>
        <div className="p-8">Loading investment opportunities...</div>
      </MainLayout>
    );
  }

  const filteredOpportunities = opportunities.filter((opp) => {
    if (selectedRisk && opp.riskLevel !== selectedRisk) return false;
    if (selectedCategory && opp.category !== selectedCategory) return false;
    return true;
  });

  const categories = [...new Set(opportunities.map((o) => o.category))];
  const riskLevels = ['low', 'moderate', 'high'];

  return (
    <MainLayout>
      <div className="space-y-8 pb-8">

        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Investment Opportunities</h1>
          <p className="text-muted-foreground">
            Discover curated investment opportunities tailored to your goals
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Filters */}
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

          {/* Opportunity Cards */}
          <div className="md:col-span-2">

            <div className="grid grid-cols-1 gap-6">

              {filteredOpportunities.length > 0 ? (
                filteredOpportunities.map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No opportunities match your filters
                  </p>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </MainLayout>
  );
}