'use client';

import { LandingNavbar } from '@/components/landing-navbar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Shield, TrendingUp, Brain, Lock, Zap } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: 'AI-Powered Insights',
      description: 'Get personalized financial recommendations powered by advanced AI algorithms',
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Portfolio Management',
      description: 'Monitor and manage your investments with real-time performance tracking',
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Risk Protection',
      description: 'Comprehensive insurance and protection strategies tailored to your needs',
    },
    {
      icon: <Lock className="h-6 w-6" />,
      title: 'Bank-Grade Security',
      description: 'Enterprise-level encryption and security protocols protect your data',
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Smart Goals',
      description: 'Set and track financial goals with actionable milestones and insights',
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Investment Hub',
      description: 'Access curated investment opportunities across multiple asset classes',
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Create Account',
      description: 'Sign up with your email and set up your security preferences',
    },
    {
      number: '2',
      title: 'Complete Profile',
      description: 'Tell us about your financial goals and investment preferences',
    },
    {
      number: '3',
      title: 'Connect Assets',
      description: 'Link your accounts and add your current holdings',
    },
    {
      number: '4',
      title: 'Start Planning',
      description: 'Receive personalized recommendations and manage your wealth',
    },
  ];

  const testimonials = [
    {
      name: 'Michael Chen',
      role: 'Entrepreneur',
      quote: 'L.E.G.E.N.D. has completely transformed how I manage my investments. The AI insights are incredibly accurate.',
    },
    {
      name: 'Emma Rodriguez',
      role: 'Software Engineer',
      quote: 'The platform is intuitive and powerful. I love the portfolio visualization and real-time updates.',
    },
    {
      name: 'David Kim',
      role: 'Financial Advisor',
      quote: 'I recommend L.E.G.E.N.D. to all my clients. The security features and goal tracking are unmatched.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />

      <main>
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-6 md:px-12 lg:px-24">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-block px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20">
              <p className="text-sm font-medium text-secondary">Your AI-Powered Wealth Partner</p>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Financial Planning
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary"> Made Intelligent</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Take control of your wealth with AI-driven insights, portfolio management, and personalized financial planning tools.
            </p>

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
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-6 md:px-12 lg:px-24 bg-card/50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Powerful Features</h2>
              <p className="text-lg text-muted-foreground">Everything you need to manage your wealth effectively</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="p-6 rounded-xl bg-background border border-border hover:border-primary/50 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-secondary/20 text-secondary flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 px-6 md:px-12 lg:px-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How It Works</h2>
              <p className="text-lg text-muted-foreground">Get started in just four simple steps</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="p-6 rounded-xl bg-card border border-border">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold mb-4">
                      {step.number}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-1 bg-gradient-to-r from-primary to-secondary" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="py-20 px-6 md:px-12 lg:px-24 bg-card/50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Enterprise-Grade Security</h2>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Lock className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground">256-Bit Encryption</h3>
                      <p className="text-muted-foreground">All data encrypted end-to-end with military-grade encryption</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Shield className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground">2FA & Biometric</h3>
                      <p className="text-muted-foreground">Multi-factor authentication with biometric login options</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Zap className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground">Real-Time Monitoring</h3>
                      <p className="text-muted-foreground">24/7 fraud detection and security monitoring</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-background border border-border rounded-xl p-8 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Security Score</span>
                  <span className="text-2xl font-bold text-secondary">98/100</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Data Encryption</span>
                    <span className="text-green-500">✓</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>2FA Enabled</span>
                    <span className="text-green-500">✓</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Fraud Protection</span>
                    <span className="text-green-500">✓</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Compliance Certified</span>
                    <span className="text-green-500">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 px-6 md:px-12 lg:px-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Trusted by Thousands</h2>
              <p className="text-lg text-muted-foreground">See what our users are saying</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="p-6 rounded-xl bg-card border border-border">
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                      <span className="text-secondary font-semibold">{testimonial.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 md:px-12 lg:px-24 bg-card/50">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Ready to Take Control?</h2>
              <p className="text-lg text-muted-foreground">Join thousands of users managing their wealth with L.E.G.E.N.D.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Get Started Free
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>

            <p className="text-muted-foreground">No credit card required. Start exploring now.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-12 px-6 md:px-12 lg:px-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-foreground mb-4">L.E.G.E.N.D.</h3>
            <p className="text-sm text-muted-foreground">AI-powered financial planning for the modern investor</p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground">Features</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground">Pricing</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground">Security</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground">About</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground">Blog</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-foreground">Privacy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground">Terms</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground">Cookies</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 L.E.G.E.N.D.. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}