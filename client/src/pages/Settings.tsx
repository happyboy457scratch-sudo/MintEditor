import React from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useUsage, useCheckout } from "@/hooks/use-usage";
import { Code2, ChevronLeft, CreditCard, Shield, Zap, CheckCircle2 } from "lucide-react";

export default function Settings() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: usage, isLoading: isUsageLoading } = useUsage();
  const checkoutMutation = useCheckout();

  if (isAuthLoading) return <div className="min-h-screen bg-background flex justify-center items-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!isAuthenticated) {
    window.location.href = "/api/login";
    return null;
  }

  const currentTier = usage?.subscriptionTier || "free";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
          <Link href="/projects" className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors -ml-2">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <Code2 className="w-5 h-5" />
            <span>Mint<span className="text-foreground">Editor</span> Settings</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Account & Billing</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-6">
            <div className="p-6 rounded-2xl bg-card border border-border/50">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-2xl uppercase mb-4 overflow-hidden ring-2 ring-primary/20 ring-offset-2 ring-offset-background">
                {user?.profileImageUrl ? <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" /> : user?.email?.charAt(0) || "U"}
              </div>
              <h2 className="font-semibold text-lg line-clamp-1">{user?.firstName} {user?.lastName}</h2>
              <p className="text-sm text-muted-foreground mb-4 truncate">{user?.email}</p>
              
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium uppercase tracking-wider">
                <Shield className="w-3.5 h-3.5" />
                {currentTier.replace('_', ' ')} Plan
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border/50">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Current Usage</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">AI Credits (Monthly)</span>
                    <span className="font-medium">{usage?.remainingCredits ?? 0} remaining</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.max(0, 100 - ((usage?.remainingCredits || 0) / 40) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <h2 className="text-xl font-semibold mb-4">Subscription Plans</h2>
            
            {/* Premium Plan */}
            <div className={`p-6 rounded-2xl border ${currentTier === 'premium' ? 'border-primary shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)] bg-primary/5' : 'border-border/50 bg-card hover:border-primary/50'} transition-all`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">Premium</h3>
                  <p className="text-muted-foreground text-sm mt-1">For professional developers</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">$3.99</div>
                  <div className="text-xs text-muted-foreground">per month</div>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                {[
                  "5 hours of daily terminal execution",
                  "40 AI Assistant credits per month",
                  "Unlimited project saves",
                  "Priority support"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {currentTier === 'premium' ? (
                <div className="w-full py-2.5 text-center bg-secondary text-muted-foreground rounded-lg font-medium cursor-default">Current Plan</div>
              ) : (
                <button 
                  onClick={() => checkoutMutation.mutate("premium")}
                  disabled={checkoutMutation.isPending}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all flex justify-center items-center shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5"
                >
                  {checkoutMutation.isPending ? "Loading..." : "Upgrade to Premium"}
                </button>
              )}
            </div>

            {/* Premium Ultimate Plan */}
            <div className={`p-6 rounded-2xl border ${currentTier === 'premium_ultimate' ? 'border-primary shadow-[0_0_30px_-10px_rgba(16,185,129,0.2)] bg-primary/5' : 'border-border/50 bg-card hover:border-primary/50'} transition-all relative overflow-hidden`}>
              {currentTier !== 'premium_ultimate' && <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-bl-lg">Best Value</div>}
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-300">Premium Ultimate</h3>
                  <p className="text-muted-foreground text-sm mt-1">No limits, maximum power</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">$7.99</div>
                  <div className="text-xs text-muted-foreground">per month</div>
                </div>
              </div>
              
              <ul className="space-y-3 mb-6">
                {[
                  "Unlimited daily terminal execution",
                  "Unlimited AI Assistant credits",
                  "All Premium features included",
                  "Early access to new features"
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {currentTier === 'premium_ultimate' ? (
                <div className="w-full py-2.5 text-center bg-secondary text-muted-foreground rounded-lg font-medium cursor-default">Current Plan</div>
              ) : (
                <button 
                  onClick={() => checkoutMutation.mutate("premium_ultimate")}
                  disabled={checkoutMutation.isPending}
                  className="w-full py-2.5 bg-gradient-to-r from-primary to-emerald-500 text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all flex justify-center items-center shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5"
                >
                  {checkoutMutation.isPending ? "Loading..." : "Get Premium Ultimate"}
                </button>
              )}
            </div>
            
            <p className="text-xs text-center text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Secure payments processed by Stripe
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
