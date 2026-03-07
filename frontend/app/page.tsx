'use client'

import { LandingNavbar } from '@/components/landing-navbar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Shield, TrendingUp, Brain, Lock, Zap } from 'lucide-react'

// 3D Landing components
import LandingHero from '@/components/landing/LandingHero'
import PortfolioChart from '@/components/landing/PortfolioChart'
import SystemStatus from '@/components/landing/SystemStatus'
import LegendMeaning from '@/components/landing/LegendMeaning'

export default function Home() {
  const features = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: 'AI-Powered Insights',
      description:
        'Get personalized financial recommendations powered by advanced AI algorithms',
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Portfolio Management',
      description:
        'Monitor and manage your investments with real-time performance tracking',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Risk Protection',
      description:
        'Comprehensive insurance and protection strategies tailored to your needs',
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: 'Bank-Grade Security',
      description:
        'Enterprise-level encryption and security protocols protect your data',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Smart Goals',
      description:
        'Set and track financial goals with actionable milestones and insights',
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Investment Hub',
      description:
        'Access curated investment opportunities across multiple asset classes',
    },
  ]

  const steps = [
    {
      number: '1',
      title: 'Create Account',
      description:
        'Sign up with your email and set up your security preferences',
    },
    {
      number: '2',
      title: 'Complete Profile',
      description:
        'Tell us about your financial goals and investment preferences',
    },
    {
      number: '3',
      title: 'Connect Assets',
      description: 'Link your accounts and add your current holdings',
    },
    {
      number: '4',
      title: 'Start Planning',
      description:
        'Receive personalized recommendations and manage your wealth',
    },
  ]

  const testimonials = [
    {
      name: 'Michael Chen',
      role: 'Entrepreneur',
      quote:
        'L.E.G.E.N.D. has completely transformed how I manage my investments. The AI insights are incredibly accurate.',
    },
    {
      name: 'Emma Rodriguez',
      role: 'Software Engineer',
      quote:
        'The platform is intuitive and powerful. I love the portfolio visualization and real-time updates.',
    },
    {
      name: 'David Kim',
      role: 'Financial Advisor',
      quote:
        'I recommend L.E.G.E.N.D. to all my clients. The security features and goal tracking are unmatched.',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />

      <main>
        {/* 3D HERO SECTION */}

        <LandingHero>
          <div className="max-w-4xl mx-auto text-center space-y-6">

            <div className="inline-block px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20">
              <p className="text-sm font-medium text-secondary">
                Your AI-Powered Wealth Partner
              </p>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Financial Planning
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                {' '}Made Intelligent
              </span>
            </h1>

            {/* LEGEND acronym animation */}
            <LegendMeaning />

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Take control of your wealth with AI-driven insights, portfolio
              management, and personalized financial planning tools.
            </p>

            {/* system boot animation */}
            <SystemStatus />

            {/* animated growth chart */}
            <PortfolioChart />

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">

              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>

              <Link href="/login">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>

            </div>

          </div>
        </LandingHero>

        {/* FEATURES */}

        <section
          id="features"
          className="py-20 px-6 md:px-12 lg:px-24 bg-card/50"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Powerful Features
              </h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to manage your wealth effectively
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="p-6 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-secondary/20 text-secondary flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}

        <section id="how-it-works" className="py-20 px-6 md:px-12 lg:px-24">
          <div className="max-w-6xl mx-auto">

            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground">
                Get started in just four simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

              {steps.map((step, index) => (
                <div key={index} className="relative">

                  <div className="p-6 rounded-xl bg-card border border-border">

                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold mb-4">
                      {step.number}
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>

                    <p className="text-muted-foreground text-sm">
                      {step.description}
                    </p>

                  </div>

                </div>
              ))}

            </div>
          </div>
        </section>

        {/* SECURITY */}

        <section
          id="security"
          className="py-20 px-6 md:px-12 lg:px-24 bg-card/50"
        >
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">

            <div>

              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Enterprise-Grade Security
              </h2>

              <div className="space-y-4">

                <div className="flex gap-4">
                  <Lock className="h-6 w-6 text-secondary" />
                  <div>
                    <h3 className="font-semibold">256-Bit Encryption</h3>
                    <p className="text-muted-foreground">
                      Military-grade encryption protects every transaction.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Shield className="h-6 w-6 text-secondary" />
                  <div>
                    <h3 className="font-semibold">Multi-Factor Authentication</h3>
                    <p className="text-muted-foreground">
                      Advanced authentication with biometric security.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Zap className="h-6 w-6 text-secondary" />
                  <div>
                    <h3 className="font-semibold">Real-Time Monitoring</h3>
                    <p className="text-muted-foreground">
                      Continuous AI threat detection and fraud monitoring.
                    </p>
                  </div>
                </div>

              </div>

            </div>

            <div className="bg-background border border-border rounded-xl p-8">
              <p className="text-muted-foreground mb-2">Security Score</p>
              <p className="text-4xl font-bold text-secondary">98 / 100</p>
            </div>

          </div>
        </section>
      </main>

      {/* FOOTER */}

      <footer className="border-t border-border bg-card/50 py-12 px-6 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="font-semibold text-foreground mb-4">L.E.G.E.N.D.</h3>
          <p className="text-sm text-muted-foreground">
            Leveraged Engine for Global Economic Navigation & Decisions
          </p>
        </div>
      </footer>

    </div>
  )
}
