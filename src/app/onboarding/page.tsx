"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, ArrowLeft, Loader2, Sparkles,
  Briefcase, Clock, Target, Heart, Wallet, Brain, Zap 
} from "lucide-react";

// ─── Onboarding Step Definitions ─────────────────────────────────

interface StepConfig {
  id: string;
  question: string;
  subtitle: string;
  type: "text" | "select" | "multi-select" | "time";
  icon: React.ReactNode;
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

const steps: StepConfig[] = [
  {
    id: "name",
    question: "What should we call you?",
    subtitle: "Your first name is perfect.",
    type: "text",
    icon: <Sparkles className="w-5 h-5" />,
    placeholder: "e.g. Abhimanyu",
    required: true,
  },
  {
    id: "occupation",
    question: "What do you do for work?",
    subtitle: "This helps us tailor your planning schedule.",
    type: "text",
    icon: <Briefcase className="w-5 h-5" />,
    placeholder: "e.g. Software Engineer, Student, Entrepreneur",
  },
  {
    id: "workSchedule",
    question: "What's your work schedule like?",
    subtitle: "Pick the closest match.",
    type: "select",
    icon: <Clock className="w-5 h-5" />,
    options: ["9 to 5", "Flexible hours", "Shift work", "Freelance", "Student schedule", "Not working currently"],
  },
  {
    id: "wakeTime",
    question: "When do you usually wake up?",
    subtitle: "We'll plan your mornings around this.",
    type: "select",
    icon: <Clock className="w-5 h-5" />,
    options: ["Before 5 AM", "5–6 AM", "6–7 AM", "7–8 AM", "8–9 AM", "After 9 AM"],
  },
  {
    id: "sleepTime",
    question: "When do you go to sleep?",
    subtitle: "Protecting your rest is just as important.",
    type: "select",
    icon: <Clock className="w-5 h-5" />,
    options: ["Before 9 PM", "9–10 PM", "10–11 PM", "11 PM–12 AM", "After midnight"],
  },
  {
    id: "struggle",
    question: "What's your biggest productivity struggle?",
    subtitle: "Be honest — this is private, and AI will use this to help you.",
    type: "select",
    icon: <Brain className="w-5 h-5" />,
    options: [
      "I procrastinate too much",
      "I can't stay consistent",
      "I feel overwhelmed by tasks",
      "I lack clear priorities",
      "I burn out easily",
      "I struggle with time management",
      "I get distracted easily",
    ],
  },
  {
    id: "lifeGoals",
    question: "What are your main life goals right now?",
    subtitle: "Pick all that apply.",
    type: "multi-select",
    icon: <Target className="w-5 h-5" />,
    options: [
      "Build a career",
      "Improve fitness",
      "Learn new skills",
      "Manage finances better",
      "Build better habits",
      "Start a business",
      "Improve relationships",
      "Reduce stress",
      "Read more",
      "Travel more",
    ],
  },
  {
    id: "healthGoals",
    question: "Any health goals?",
    subtitle: "We can track and remind you.",
    type: "multi-select",
    icon: <Heart className="w-5 h-5" />,
    options: [
      "Lose weight",
      "Build muscle",
      "Run regularly",
      "Better sleep",
      "Eat healthier",
      "Meditate daily",
      "Reduce screen time",
      "Drink more water",
    ],
  },
  {
    id: "financeGoals",
    question: "Financial goals?",
    subtitle: "Optional — skip if you'd rather not.",
    type: "multi-select",
    icon: <Wallet className="w-5 h-5" />,
    options: [
      "Save more money",
      "Invest regularly",
      "Track spending",
      "Pay off debt",
      "Build an emergency fund",
      "Start a side income",
    ],
  },
  {
    id: "workStyle",
    question: "How do you prefer to work?",
    subtitle: "This shapes your daily plan layout.",
    type: "select",
    icon: <Zap className="w-5 h-5" />,
    options: [
      "Deep focus blocks",
      "Short sprints",
      "Pomodoro technique",
      "Flexible / unstructured",
      "Time-blocked calendar",
      "Batching similar tasks",
    ],
  },
];

// ─── Component ─────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentAnswer = answers[step.id];

  const setAnswer = useCallback(
    (value: string | string[]) => {
      setAnswers((prev) => ({ ...prev, [step.id]: value }));
    },
    [step.id]
  );

  const toggleMultiSelect = useCallback(
    (option: string) => {
      const current = (answers[step.id] as string[]) || [];
      if (current.includes(option)) {
        setAnswer(current.filter((o) => o !== option));
      } else {
        setAnswer([...current, option]);
      }
    },
    [answers, step.id, setAnswer]
  );

  const canProceed = () => {
    if (!step.required && !currentAnswer) return true; // Optional step
    if (step.type === "multi-select") return true; // Multi-select can be empty
    if (step.required && !currentAnswer) return false;
    if (typeof currentAnswer === "string" && currentAnswer.trim() === "") return false;
    return true;
  };

  const next = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    } else {
      finishOnboarding();
    }
  };

  const back = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  const finishOnboarding = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (res.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      // Allow retry
      setIsGenerating(false);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6 font-[family-name:var(--font-geist-sans)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Sparkles className="w-7 h-7 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight mb-3">Building your system…</h2>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
            Our AI is crafting your personalized routines, habits, and first weekly plan based on your preferences. This takes a few seconds.
          </p>
          <div className="flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-black rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col font-[family-name:var(--font-geist-sans)]">
      {/* Progress Bar */}
      <div className="fixed top-0 inset-x-0 z-50 h-1 bg-zinc-200">
        <motion.div
          className="h-full bg-black"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        />
      </div>

      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-zinc-200/50 bg-white/80 backdrop-blur">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
            <span className="text-white text-xs font-bold">M2</span>
          </div>
          <span className="font-semibold tracking-tight">myday2</span>
        </div>
        <span className="text-xs font-medium text-zinc-500">
          {currentStep + 1} of {steps.length}
        </span>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step.id}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600 mb-6">
                {step.icon}
              </div>

              {/* Question */}
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-2">
                {step.question}
              </h2>
              <p className="text-zinc-500 text-sm mb-8">{step.subtitle}</p>

              {/* Input Area */}
              {step.type === "text" && (
                <input
                  type="text"
                  value={(currentAnswer as string) || ""}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={step.placeholder}
                  autoFocus
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-300 transition-all placeholder:text-zinc-400"
                  onKeyDown={(e) => e.key === "Enter" && canProceed() && next()}
                />
              )}

              {step.type === "select" && step.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {step.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => setAnswer(option)}
                      className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        currentAnswer === option
                          ? "bg-black text-white border-black"
                          : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {step.type === "multi-select" && step.options && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {step.options.map((option) => {
                    const selected = ((currentAnswer as string[]) || []).includes(option);
                    return (
                      <button
                        key={option}
                        onClick={() => toggleMultiSelect(option)}
                        className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                          selected
                            ? "bg-black text-white border-black"
                            : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10">
            <button
              onClick={back}
              disabled={currentStep === 0}
              className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <button
              onClick={next}
              disabled={!canProceed()}
              className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  Generate my system <Sparkles className="w-4 h-4" />
                </>
              ) : (
                <>
                  Continue <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
