import React, { useState, useEffect } from 'react';
import { auth, signInWithGoogle, continueAsGuest, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layout } from './components/Layout';
import { DailyPage } from './components/DailyPage';
import { WeeklyHabits } from './components/WeeklyHabits';
import { MonthlyGoals } from './components/MonthlyGoals';
import { LongTermPlans } from './components/LongTermPlans';
import { FocusGoals } from './components/FocusGoals';
import { BodyArchive } from './components/BodyArchive';
import { Dashboard } from './components/Dashboard';
import { Profile } from './components/Profile';
import { Settings } from './components/Settings';
import { Loader2, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            const initialProfile = {
              uid: user.uid,
              name: user.displayName || 'User',
              email: user.email,
              photoURL: user.photoURL,
              createdAt: serverTimestamp(),
              height: 0,
              weight: 0,
              age: 0,
              gender: 'other',
            };
            setDoc(userRef, initialProfile).catch(() => {});
          }
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code === 'auth/user-cancelled' || error.code === 'auth/popup-closed-by-user') {
        toast.info("Sign-in cancelled. Please try again if you'd like to log in.");
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Sign-in popup blocked. Please allow popups for this site or try again.');
      } else {
        toast.error('Google Sign-In is not fully set up yet on this device. Use "Continue as Guest" for now, or see SETUP.md.');
        console.error('Sign-in error:', error);
      }
    }
  };

  const handleGuest = async () => {
    try {
      await continueAsGuest();
    } catch (error: any) {
      toast.error('Could not start guest mode. Please try again.');
      console.error('Guest sign-in error:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FBFBFA] p-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-[400px]">
          <Card className="border border-border shadow-sm bg-white rounded-xl overflow-hidden">
            <CardHeader className="text-center pt-10 pb-6">
              <div className="mx-auto bg-black w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                <span className="text-xl font-bold text-white">m2</span>
              </div>
              <CardTitle className="text-[24px] font-bold tracking-tight text-foreground">myday2</CardTitle>
              <CardDescription className="text-[14px] text-muted-foreground mt-1">continuity starts here.</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-10">
              <Button onClick={handleSignIn} className="w-full h-10 text-[14px] font-medium gap-2 bg-black text-white hover:bg-black/90">
                <LogIn className="h-4 w-4" />
                Sign in with Google
              </Button>
              <Button onClick={handleGuest} variant="outline" className="w-full h-10 text-[14px] font-medium mt-2.5">
                Continue as Guest
              </Button>
              <p className="text-[11px] text-center mt-8 text-muted-foreground leading-relaxed">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'daily': return <DailyPage user={user} />;
      case 'habits': return <WeeklyHabits user={user} />;
      case 'goals': return <MonthlyGoals user={user} />;
      case 'plans': return <LongTermPlans user={user} />;
      case 'focus': return <FocusGoals user={user} />;
      case 'body': return <BodyArchive user={user} />;
      case 'dashboard': return <Dashboard user={user} />;
      case 'settings': return <Settings user={user} />;
      case 'profile': return <Profile user={user} profile={userProfile} />;
      default: return <DailyPage user={user} />;
    }
  };

  return (
    <ErrorBoundary>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="pb-24"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </Layout>
      <Toaster position="top-center" />
    </ErrorBoundary>
  );
}
