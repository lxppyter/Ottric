'use client';

import Link from 'next/link';
import { ArrowRight, Shield, Sparkles, Activity, Share2, CheckCircle, Server, GitBranch, Database, MessageSquare, Box, Loader2, Code, Cpu, Lock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { toast } from "sonner";
import api from '@/lib/axios';
import { Input } from '@/components/ui/input';

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden selection:bg-primary/30">
      
      {/* Background Effects */}
      <div className="fixed inset-0 bg-cyberpunk-grid pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center max-w-7xl mx-auto backdrop-blur-sm">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
             <Shield className="w-4 h-4 text-black" />
           </div>
           <span className="font-bold tracking-widest uppercase text-sm">Ottric</span>
        </div>
        <div className="flex items-center gap-4">
             {isLoggedIn ? (
                 <Link href="/dashboard">
                    <Button variant="outline" className="rounded-full border-white/20 bg-white/5 hover:bg-primary hover:text-black hover:border-primary transition-all duration-300 font-bold uppercase tracking-widest text-xs h-9 px-6">
                        Dashboard
                    </Button>
                 </Link>
             ) : (
                 <>
                     <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors uppercase tracking-widest hidden md:block">
                        Login
                     </Link>
                     <Link href="/register">
                        <Button variant="outline" className="rounded-full border-white/20 bg-white/5 hover:bg-primary hover:text-black hover:border-primary transition-all duration-300 font-bold uppercase tracking-widest text-xs h-9 px-6">
                            Get Access
                        </Button>
                     </Link>
                 </>
             )}
        </div>
      </nav>

      {/* 1. Hero Section */}
      <section className="min-h-screen relative flex items-center justify-center pt-20 px-6">
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
           <div className="inline-flex justify-center">
             <Badge variant="outline" className="border-secondary/50 text-secondary bg-secondary/10 tracking-[0.2em] uppercase text-[10px] py-1.5 px-4 rounded-full backdrop-blur-md">
               <Sparkles className="w-3 h-3 mr-2" />
               SBOM + VEX Automation
             </Badge>
           </div>
           <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none">
              Automate <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Compliance.</span>
              <br />
              Unblock <span className="text-white/80">Sales.</span>
           </h1>
           <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed tracking-wide">
             Generate SBOMs per release, link vulnerabilities to versions, and prove &quot;Not Affected&quot; status via VEX. 
             <span className="text-white font-medium"> The unified trust protocol for modern software delivery.</span>
           </p>
           <div className="flex flex-col md:flex-row gap-4 justify-center items-center pt-8">
              <Link href="#waitlist">
                <Button size="lg" className="h-14 px-10 rounded-2xl bg-gradient-to-r from-primary to-secondary text-black font-black uppercase tracking-widest hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(212,93,133,0.3)] border-none">
                   Join the Waitlist
                   <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="h-14 px-10 rounded-full border-white/20 bg-white/5 hover:bg-primary hover:text-black hover:border-primary transition-all duration-300 font-bold uppercase tracking-widest backdrop-blur-sm">
                   How it Works?
                </Button>
              </Link>
           </div>
           <div className="pt-12 flex justify-center gap-8 text-xs font-mono text-muted-foreground uppercase tracking-widest opacity-60">
              <span className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-primary" /> CI/CD Native</span>
              <span className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-primary" /> Audit Ready</span>
              <span className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-primary" /> Cryptographic</span>
           </div>
        </div>
      </section>

      {/* 2. Problem Section */}
      <section className="py-40 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-6xl font-black leading-none mb-8 tracking-tighter">
              They want <span className="text-primary">SBOMs.</span>
              <br />
              They ask for <span className="text-secondary">VEX.</span>
              <br />
              <span className="text-muted-foreground">Your team can&apos;t keep up.</span>
            </h2>
            <p className="text-lg font-light border-l-2 border-primary/50 pl-6 text-white/80">
              Generating an SBOM is not enough — you need to manage it, link it to a release, and deliver it to customer security teams without the manual chaos.
            </p>
          </div>
          <div className="space-y-4">
            {[
              "Every enterprise customer asks: 'Do you have an SBOM? Which version is affected?'",
              "When a CVE hits, noise skyrockets: 20 repos, 10 releases, who is affected?",
              "Even when you say 'Not Affected', procurement demands proof.",
              "Security and Sales teams are drowning in Excel sheets."
            ].map((item, i) => (
              <div key={i} className="glass-panel p-6 rounded-2xl flex gap-4 items-start hover:bg-white/5 transition-colors">
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 shrink-0 mt-0.5 text-xs font-bold">!</div>
                <p className="font-light text-white/90 leading-snug">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Solution Section */}
      <section className="py-40 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">SBOM Ops + VEX Ops + Customer Delivery.</h2>
            <p className="text-xl text-muted-foreground font-light">
              Our platform tracks your releases automatically, standardizes SBOMs, links vulnerabilities to versions, and generates <span className="text-white font-medium">decision + proof</span> via VEX workflows.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <GitBranch className="w-6 h-6 text-primary"/>, title: "Build-to-Release Lineage", desc: "Commit → Build → Artifact Digest → SBOM. Automated linkage." },
              { icon: <Activity className="w-6 h-6 text-secondary"/>, title: "Vuln → Version Mapping", desc: "Clear answer to 'which version is affected?' in seconds." },
              { icon: <Share2 className="w-6 h-6 text-accent"/>, title: "Customer Portal", desc: "The single secure link you paste into procurement forms." }
            ].map((card, i) => (
              <div key={i} className="glass-panel p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300 group border-t border-white/10">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-white group-hover:scale-110 transition-transform">
                    {card.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 tracking-tight">{card.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. How It Works */}
      <section id="how-it-works" className="py-40 px-6 bg-secondary/5 border-y border-white/5 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black mb-16 text-center tracking-tighter"><span className="text-primary">How it Works</span> (4 Steps)</h2>
          <div className="grid md:grid-cols-4 gap-8 relative z-10">
            {[
              { step: "01", title: "Connect", desc: "Integrate GitHub/GitLab + CI + Registry." },
              { step: "02", title: "Generate", desc: "Generate SBOM in CI or extract automatically." },
              { step: "03", title: "Decide", desc: "Link CVEs to versions. Enter VEX status & proof." },
              { step: "04", title: "Share", desc: "Publish SBOM + VEX via Portal. Export Audit Pack." }
            ].map((item, i) => (
              <div key={i} className="relative group h-full">
                <div className="glass-panel p-6 rounded-2xl h-full border border-white/5 relative overflow-hidden flex flex-col">
                    <div className="text-5xl font-black text-white/10 mb-6 group-hover:text-primary transition-colors select-none">{item.step}</div>
                    <div className="relative z-10">
                      <h3 className="text-xl font-bold mb-3 uppercase tracking-wide text-white">{item.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                    </div>
                </div>
                {i !== 3 && <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-[1px] bg-gradient-to-r from-primary to-transparent" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Core Features */}
      <section className="py-40 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tighter">Not just SBOMs.<br/><span className="text-secondary">Operations, Proof, Delivery.</span></h2>
            <div className="space-y-2">
              {[
                "SBOM Normalization: SPDX/CycloneDX converted to a single model",
                "Release Lineage: Ends the 'which artifact is this SBOM for?' question",
                "Vulnerability Correlation: CVE → component → version impact analysis",
                "VEX Workflow: Affected / Not Affected / Under Investigation / Fixed",
                "Evidence-first: Approval flow + justification for 'Not Affected' decisions",
                "Customer Portal + API: Self-service downloads for customers",
                "Audit Pack Export: PDF/JSON package for auditors/customers"
              ].map((feat, i) => (
                <div key={i} className="flex gap-3 items-center py-4 border-b border-white/5 group hover:pl-2 transition-all cursor-default relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 relative z-10" />
                  <span className="font-medium text-sm md:text-base text-white/90 relative z-10">{feat}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
             <div className="glass-panel p-8 rounded-3xl border-2 border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
                
                {/* Abstract UI: VEX Decision */}
                <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                            <span className="font-mono text-sm tracking-widest text-red-400">CVE-2024-3094</span>
                        </div>
                        <Badge variant="outline" className="border-red-500/50 text-red-400 bg-red-500/10">CRITICAL</Badge>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground uppercase tracking-wider">
                            <span>Status Analysis</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" className="border-white/10 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 h-10 text-xs">Affected</Button>
                            <Button className="bg-accent/20 text-accent border border-accent/50 h-10 text-xs hover:bg-accent/30">Not Affected</Button>
                        </div>
                    </div>

                    <div className="bg-black/40 rounded-xl p-4 space-y-2">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Justification</span>
                        <div className="h-2 w-3/4 bg-white/10 rounded-full" />
                        <div className="h-2 w-1/2 bg-white/10 rounded-full" />
                    </div>

                    <div className="pt-2">
                        <Button className="w-full bg-secondary text-white hover:bg-secondary/80">Sign & Publish VEX</Button>
                    </div>
                </div>
             </div>
             {/* Glow */}
             <div className="absolute -inset-10 bg-gradient-to-r from-primary to-secondary opacity-5 blur-3xl -z-10 rounded-full" />
          </div>
        </div>
      </section>

      {/* 6. Use Cases */}
      <section className="py-20 px-6 bg-black/40">
        <div className="max-w-7xl mx-auto w-full">
            <h2 className="text-center text-4xl md:text-5xl font-black mb-16 tracking-tighter">Who is this for?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { title: "B2B SaaS Teams", subtitle: "Selling to Enterprise" },
                    { title: "Security Products", subtitle: "Agent / Endpoint" },
                    { title: "SDK Providers", subtitle: "Library Vendors" },
                    { title: "On-Prem Vendors", subtitle: "Self-hosted Distros" }
                ].map((uc, i) => (
                    <div key={i} className="glass-panel p-12 text-center hover:bg-primary/20 transition-colors border border-primary/20 group cursor-pointer flex flex-col justify-center min-h-[240px]">
                        <h3 className="text-2xl font-bold uppercase mb-4 group-hover:text-primary transition-colors">{uc.title}</h3>
                        <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">{uc.subtitle}</p>
                    </div>
                ))}
            </div>
            <div className="mt-16 grid md:grid-cols-3 gap-8">
                {[
                    "“Customer security form received → Send SBOM link → Done.”",
                    "“Critical CVE out → Check which releases are impacted in 2 mins.”",
                    "“We are not affected → VEX + Proof → Fast procurement approval.”"
                ].map((quote, i) => (
                    <div key={i} className="bg-secondary/5 p-6 border-l-2 border-secondary rounded-r-xl italic font-light text-white/80">
                        {quote}
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 8. Differentiation */}
      <section className="py-40 px-6">
         <div className="max-w-7xl mx-auto">
            <div className="mb-16 text-center lg:text-left">
                <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">Generating SBOMs is a commodity.</h2>
                <h2 className="text-4xl md:text-5xl font-black text-primary tracking-tighter">We sell &quot;Delivery & Proof&quot;.</h2>
            </div>
            
            <div className="grid gap-6">
                {[
                    { them: "SBOM generators create files", us: "We link to releases + publish to customers" },
                    { them: "SCA tools find vulns", us: "We manage decisions + proof via VEX workflows" },
                    { them: "SBOM repos store files", us: "We offer release lineage + customer portals" }
                ].map((row, i) => (
                    <div key={i} className="grid md:grid-cols-2 gap-6 items-center glass-panel p-8 border-l-4 border-l-transparent hover:border-l-primary transition-all">
                        <div className="opacity-50 line-through decoration-red-500 decoration-2 text-lg font-mono">{row.them}</div>
                        <div className="flex items-center gap-3 font-bold text-xl text-white">
                            <ArrowRight className="w-5 h-5 text-primary" />
                            {row.us}
                        </div>
                    </div>
                ))}
            </div>
         </div>
      </section>
      


      {/* 9 & 10. Split: Security & Integrations */}
      <section className="py-40 px-6 bg-secondary/5 border-y border-white/5">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16">
             
             {/* Left: Security */}
             <div className="flex flex-col justify-center">
                 <h2 className="text-4xl font-black mb-8 tracking-tighter">Security & Control is Yours.</h2>
                 <p className="text-lg text-muted-foreground mb-8 font-light">
                    Built for the most demanding compliance standards. Your data is isolated, encrypted, and yours.
                 </p>
                 <div className="flex flex-wrap gap-3">
                     {["Tenant Isolation & RBAC", "Retention & Access Logs", "Optional Self-Host / VPC", "Signing / Attestation"].map((tag, i) => (
                        <div key={i} className="px-5 py-2.5 border border-white/10 rounded-lg bg-black/40 backdrop-blur-sm text-sm font-medium uppercase tracking-wide flex items-center gap-2">
                            <Shield className="w-3 h-3 text-secondary" />
                            {tag}
                        </div>
                     ))}
                 </div>
             </div>

             {/* Right: Integrations */}
             <div>
                 <h2 className="text-4xl font-black mb-8 tracking-tighter text-right lg:text-left">Fits Your Workflow.</h2>
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                        { cat: "SCM", items: ["GitHub", "GitLab"] },
                        { cat: "CI/CD", items: ["Actions", "Jenkins", "CircleCI"] },
                        { cat: "Registry", items: ["GHCR", "ECR", "DockerHub"] },
                        { cat: "Ticketing", items: ["Jira", "Linear"] },
                        { cat: "Chat", items: ["Slack", "Teams"] }
                    ].map((sect, i) => (
                        <div key={i} className="glass-panel p-5 rounded-xl border border-white/5 hover:bg-white/5 transition-all text-center">
                            <h3 className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground mb-3">{sect.cat}</h3>
                            <div className="flex flex-wrap gap-1.5 justify-center">
                                {sect.items.map(s => (
                                    <span key={s} className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase text-white/90 bg-white/5 border border-white/5">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                 </div>
             </div>

          </div>
      </section>

      {/* 11. Pricing Plans */}
      <section className="py-40 px-6 bg-gradient-to-b from-transparent to-black/80" id="pricing">
          <div className="max-w-7xl mx-auto">
              <div className="text-center max-w-3xl mx-auto mb-16">
                  <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">Simple Pricing.</h2>
                  <p className="text-xl text-muted-foreground">
                      Start small, upgrade for <span className="text-white font-medium">Compliance & Retention</span>.
                  </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 items-start">
                  
                  {/* Free Tier */}
                  <div className="glass-panel p-8 rounded-3xl border border-white/5 relative group hover:border-white/20 transition-colors">
                      <div className="mb-8">
                          <h3 className="text-lg font-bold uppercase tracking-widest text-muted-foreground mb-4">Starter</h3>
                          <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-black text-white">$0</span>
                              <span className="text-sm text-muted-foreground">/ month</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                              For individuals and testing.
                          </p>
                      </div>
                      <div className="space-y-4 mb-8">
                          {[
                              "1 Active Project",
                              "Unlimited SBOM Ingest",
                              "Basic VEX Workflow",
                              "PDF Export",
                          ].map((feat, i) => (
                              <div key={i} className="flex gap-3 items-center text-sm text-white/80">
                                  <CheckCircle className="w-4 h-4 text-white/40 shrink-0" />
                                  <span>{feat}</span>
                              </div>
                          ))}
                           <div className="flex gap-3 items-center text-sm text-muted-foreground/50 line-through decoration-white/20">
                                  <CheckCircle className="w-4 h-4 text-white/10 shrink-0" />
                                  <span>Audit History</span>
                           </div>
                           <div className="flex gap-3 items-center text-sm text-muted-foreground/50 line-through decoration-white/20">
                                  <CheckCircle className="w-4 h-4 text-white/10 shrink-0" />
                                  <span>Retained Justifications</span>
                           </div>
                      </div>
                      <Button className="w-full bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 rounded-xl h-12 font-bold uppercase tracking-wide transition-all">
                          Start Free
                      </Button>
                  </div>

                  {/* Pro Tier - Highlighted */}
                  <div className="glass-panel p-8 rounded-3xl border-2 border-primary/50 relative group bg-primary/5 -mt-4 shadow-[0_0_50px_rgba(212,93,133,0.1)]">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-primary to-secondary text-black font-black text-[10px] tracking-widest uppercase px-4 py-1.5 rounded-full">
                          Most Popular
                      </div>
                      <div className="mb-8">
                          <h3 className="text-lg font-bold uppercase tracking-widest text-primary mb-4">Pro</h3>
                          <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-black text-white">$49</span>
                              <span className="text-sm text-muted-foreground">/ month</span>
                          </div>
                          <p className="text-sm text-white/80 mt-4 leading-relaxed">
                              For teams requiring compliance.
                          </p>
                      </div>
                      <div className="space-y-4 mb-8">
                          {[
                              "Unlimited Projects",
                              "Full Audit Trail & History",
                              "Retained VEX Justifications",
                              "Release Lineage Tracking",
                              "Customer Portal Access",
                              "API Access"
                          ].map((feat, i) => (
                              <div key={i} className="flex gap-3 items-center text-sm font-medium text-white">
                                  <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                                  <span>{feat}</span>
                              </div>
                          ))}
                      </div>
                      <Button className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 border-0 rounded-xl h-12 font-bold uppercase tracking-wide shadow-lg shadow-primary/20">
                          Start Pro
                      </Button>
                      <p className="text-[10px] text-center mt-4 text-primary/60 uppercase tracking-widest font-mono">
                          Compliance Ready
                      </p>
                  </div>

                  {/* Enterprise Tier */}
                  <div className="glass-panel p-8 rounded-3xl border border-white/5 relative group hover:border-white/20 transition-colors">
                      <div className="mb-8">
                          <h3 className="text-lg font-bold uppercase tracking-widest text-muted-foreground mb-4">Enterprise</h3>
                          <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-black text-white">Custom</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                              For large scale organizations.
                          </p>
                      </div>
                      <div className="space-y-4 mb-8">
                          {[
                              "Everything in Pro",
                              "SSO (Okta, SAML)",
                              "SLA Support",
                              "Self-Hosted / VPC Option",
                              "Custom Data Retention",
                              "Dedicated Account Manager"
                          ].map((feat, i) => (
                              <div key={i} className="flex gap-3 items-center text-sm text-white/80">
                                  <CheckCircle className="w-4 h-4 text-white/40 shrink-0" />
                                  <span>{feat}</span>
                              </div>
                          ))}
                      </div>
                      <Button variant="outline" className="w-full bg-transparent hover:bg-white text-white hover:text-black border border-white/20 rounded-xl h-12 font-bold uppercase tracking-wide transition-all">
                          Contact Sales
                      </Button>
                  </div>

              </div>
          </div>
      </section>

      {/* 12. FAQ */}
      <section className="py-40 px-6">
        <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-black mb-16 text-center tracking-tighter">FAQ</h2>
            <div className="grid md:grid-cols-2 gap-6">
                {[
                    { q: "We already generate SBOMs, do we need this?", a: "Yes. Generating is not enough; Release lineage + Customer Delivery + VEX decision/proof is the real burden we solve." },
                    { q: "Which formats do you support?", a: "We work with SPDX and CycloneDX; normalizing them to manage in a single model." },
                    { q: "Who fills out the VEX?", a: "Your Security or Maintenance teams. The platform provides flows for justification and approval." },
                    { q: "Is the Customer Portal mandatory?", a: "No. You can use API/Export only. But the Portal speeds up procurement significantly." },
                    { q: "Can I host this on-premise?", a: "Yes. Our Enterprise plan includes options for VPC and self-hosted deployments for complete data isolation." },
                    { q: "Does it integrate with Jira?", a: "Absolutely. We can sync VEX status changes directly to Jira tickets to keep your engineering team in the loop." },
                    { q: "What about legacy projects?", a: "You can manually upload SBOMs for legacy applications that aren't in your active CI/CD pipeline." },
                    { q: "Is my data secure?", a: "We follow SOC2 Type II standards. All data is encrypted at rest and in transit, with optional tenant isolation." }
                ].map((faq, i) => (
                    <div key={i} className="glass-panel p-8 rounded-3xl hover:bg-white/5 transition-colors border border-white/5">
                        <h3 className="font-bold text-lg mb-3 text-white">{faq.q}</h3>
                        <p className="text-muted-foreground leading-relaxed text-sm font-light">{faq.a}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* 13. Final CTA - Waitlist */}
      <section id="waitlist" className="py-40 px-6 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent pointer-events-none" />
          <div className="max-w-3xl mx-auto relative z-10">
              <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tighter">
                  Join the <span className="text-primary">Waitlist.</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-12 max-w-xl mx-auto font-light">
                  Secure your spot in the unified trust protocol. Early access includes white-glove onboarding.
              </p>
              
              <WaitlistForm />
              
          </div>
      </section>

      {/* Glassmorphism Footer */}
      <footer className="relative z-50 pt-32 pb-16 px-6 border-t border-white/10 bg-black/90">
          <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-16">
            
            {/* Brand */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Shield className="w-4 h-4 text-black" />
                  </div>
                  <span className="font-bold tracking-widest uppercase text-sm">Ottric</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                  The unified trust protocol for modern software delivery. Secure your pipeline with automated compliance.
                </p>
                <div className="flex gap-4">
                  {/* Social placeholders */}
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="w-3 h-3 bg-white/40 rounded-full" />
                    </div>
                  ))}
                </div>
            </div>

            {/* Links 1 */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-widest mb-6">Product</h3>
              <ul className="space-y-4 text-sm text-muted-foreground">
                {['Features', 'Integrations', 'Pricing', 'Changelog', 'Docs'].map((item) => (
                  <li key={item}>
                    <Link href="#" className="hover:text-primary transition-colors">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Links 2 */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-widest mb-6">Company</h3>
              <ul className="space-y-4 text-sm text-muted-foreground">
                {['About', 'Careers', 'Blog', 'Contact', 'Partners'].map((item) => (
                  <li key={item}>
                    <Link href="#" className="hover:text-primary transition-colors">{item}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h3 className="font-bold text-sm uppercase tracking-widest mb-6">Subscribe</h3>
              <p className="text-xs text-muted-foreground mb-4">Join our secure transmission list for updates.</p>
              <div className="flex gap-2">
                 <Input placeholder="email@domain.com" className="bg-white/5 border-white/10 h-10 text-xs focus:border-primary/50" />
                 <Button size="sm" className="h-10 px-4 bg-primary text-black hover:bg-primary/90">
                    <ArrowRight className="w-4 h-4" />
                 </Button>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
              <p>© 2026 Ottric Sec Inc. All rights reserved.</p>
              <div className="flex gap-6">
                <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                <Link href="#" className="hover:text-white transition-colors">Cookie Settings</Link>
              </div>
          </div>
      </footer>

    </div>
  );
}

function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/users/waitlist', { email });
      setSubmitted(true);
      toast.success("You have joined the waitlist!");
      setEmail('');
    } catch (error) {
      console.error(error);
      toast.error("Failed to join waitlist. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="glass-panel p-8 rounded-2xl max-w-md mx-auto animate-in fade-in zoom-in duration-500 border border-primary/20 bg-primary/5">
        <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">You&apos;re on the list!</h3>
        <p className="text-muted-foreground">We&apos;ll be in touch soon with your access invite.</p>
        <Button onClick={() => setSubmitted(false)} variant="link" className="mt-4 text-white">Register another email</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
      <Input 
        type="email" 
        placeholder="ENTER EMAIL_ADDRESS" 
        className="h-14 bg-white/5 border-white/10 text-lg px-6 rounded-xl font-mono focus:border-primary/50"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={loading}
      />
      <Button 
        type="submit" 
        size="lg" 
        className="h-14 px-8 rounded-xl bg-white text-black font-bold uppercase tracking-widest hover:bg-primary transition-colors disabled:opacity-50"
        disabled={loading}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
      </Button>
      <p className="text-xs text-muted-foreground mt-4 md:hidden">Limited spots available for the beta.</p>
    </form>
  );
}
