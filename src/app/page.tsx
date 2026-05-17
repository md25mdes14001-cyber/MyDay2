"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Brain, Calendar, CheckCircle2, LineChart, Sparkles, Zap } from "lucide-react";

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 selection:bg-black selection:text-white font-sans overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
              <span className="text-white text-xs font-bold">M2</span>
            </div>
            <span className="font-semibold tracking-tight text-lg">myday2</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
            <Link href="#features" className="hover:text-black transition-colors">Features</Link>
            <Link href="#ai" className="hover:text-black transition-colors">AI Engine</Link>
            <Link href="#pricing" className="hover:text-black transition-colors">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-black transition-colors text-zinc-600">
              Log in
            </Link>
            <Link href="/signup" className="text-sm font-medium bg-black text-white px-4 py-2 rounded-full hover:bg-zinc-800 transition-all active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-medium mb-8">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Introducing the new AI Engine</span>
          </motion.div>
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-semibold tracking-tight text-balance leading-[1.1] mb-6">
            Your AI-powered second brain for life, work, habits, and goals.
          </motion.h1>
          <motion.p variants={itemVariants} className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto text-balance mb-10">
            A minimalist operating system that reduces mental overload. Plan, track, and execute with an intelligent assistant that understands your rhythm.
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-black text-white px-8 py-3.5 rounded-full font-medium hover:bg-zinc-800 transition-all active:scale-95 text-lg">
              Start building your system <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Product Mockup */}
      <section className="px-6 pb-20 md:pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-2xl border border-zinc-200 bg-white/50 backdrop-blur shadow-2xl overflow-hidden">
            <div className="aspect-video bg-zinc-100 flex items-center justify-center">
              <span className="text-zinc-400 font-medium">Dashboard Interface Visualization</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section id="features" className="py-20 md:py-32 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">Everything you need, nothing you don't.</h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">A calm space to focus on what truly matters, stripped of unnecessary noise.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<CheckCircle2 />}
              title="Smart Task Management"
              description="Prioritize flawlessly. Drag-and-drop organization with AI-suggested estimates and breakdowns."
            />
            <FeatureCard 
              icon={<Calendar />}
              title="Adaptive Planning"
              description="Generate daily and weekly plans. Rebalance your schedule instantly when life happens."
            />
            <FeatureCard 
              icon={<LineChart />}
              title="Habit & Goal Tracking"
              description="Build streaks and hit milestones. Visual consistency graphs and deep productivity insights."
            />
          </div>
        </div>
      </section>

      {/* AI Workflow Section */}
      <section id="ai" className="py-20 md:py-32 bg-zinc-50 px-6 border-y border-zinc-200/50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-zinc-200 text-xs font-medium mb-6">
              <Brain className="w-3.5 h-3.5" />
              <span>Intelligent Core</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-6 text-balance">
              Not just another to-do list. An execution engine.
            </h2>
            <div className="space-y-6">
              <WorkflowStep number="01" title="Goal Decomposition" description="Tell AI your massive long-term goal. Watch it break down into milestones, weekly plans, and daily habits instantly." />
              <WorkflowStep number="02" title="Dynamic Rescheduling" description="Missed a few tasks? The AI automatically rebalances your schedule to prevent burnout while keeping you on track." />
              <WorkflowStep number="03" title="Deep Insights" description="Weekly and monthly reviews generated automatically, highlighting productivity patterns and burnout signals." />
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-zinc-200 to-zinc-100 rounded-3xl p-8 flex items-center justify-center">
              <div className="text-center">
                <Brain className="w-16 h-16 mx-auto mb-4 text-zinc-400" />
                <p className="text-zinc-500 font-medium">AI Processing Visualization</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">Ready to regain control?</h2>
          <p className="text-xl text-zinc-500 mb-10 text-balance">Join thousands building a calm, structured, and highly productive life with myday2.</p>
          <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-black text-white px-8 py-4 rounded-full font-medium hover:bg-zinc-800 transition-all active:scale-95 text-lg">
            Create your AI Profile <Zap className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-black rounded-sm flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">M2</span>
            </div>
            <span className="font-semibold tracking-tight">myday2</span>
          </div>
          <p className="text-zinc-500 text-sm">© {new Date().getFullYear()} myday2. All rights reserved.</p>
          <div className="flex gap-4 text-sm text-zinc-500">
            <Link href="#" className="hover:text-black">Twitter</Link>
            <Link href="#" className="hover:text-black">Privacy</Link>
            <Link href="#" className="hover:text-black">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-800 mb-6 shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
}

function WorkflowStep({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="flex gap-4">
      <div className="text-sm font-medium text-zinc-400 pt-1">{number}</div>
      <div>
        <h4 className="text-lg font-semibold mb-1">{title}</h4>
        <p className="text-zinc-500">{description}</p>
      </div>
    </div>
  );
}
