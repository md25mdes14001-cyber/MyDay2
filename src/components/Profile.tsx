import React, { useState } from 'react';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Ruler, Weight, Calendar, Info, LogOut, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/firebase';

export function Profile({ user, profile }: { user: any, profile: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    height: profile?.height || 0,
    weight: profile?.weight || 0,
    age: profile?.age || 0,
    gender: profile?.gender || 'other',
  });

  const calculateBMI = () => {
    if (!profile?.height || !profile?.weight) return 0;
    const heightInMeters = profile.height / 100;
    return (profile.weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const calculateBMR = () => {
    if (!profile?.height || !profile?.weight || !profile?.age) return 0;
    // Mifflin-St Jeor Equation
    let bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age);
    if (profile.gender === 'male') bmr += 5;
    else if (profile.gender === 'female') bmr -= 161;
    return Math.round(bmr);
  };

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), formData);
      toast.success("Profile updated!");
      setIsEditing(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const bmi = calculateBMI();
  const bmr = calculateBMR();

  return (
    <div className="space-y-6">
      <header className="header-section flex items-center justify-between">
        <div>
          <h2 className="text-[32px] font-bold tracking-tight text-foreground">Profile</h2>
          <p className="text-[14px] text-muted-foreground mt-1">Manage your personal metrics and account.</p>
        </div>
        <Button variant="outline" onClick={() => auth.signOut()} className="text-[13px] h-9">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border border-border shadow-sm bg-white">
          <CardContent className="pt-8 flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-6 ring-1 ring-border">
              <AvatarImage src={user.photoURL} />
              <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold">{profile?.name}</h3>
            <p className="text-muted-foreground text-[13px] mb-6">{user.email}</p>
            
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="bg-muted/50 p-3 rounded-lg border border-border">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">BMI</p>
                <p className="text-lg font-bold">{bmi || '--'}</p>
                <Badge variant="outline" className="mt-2 text-[9px] font-medium h-5 px-1.5">
                  {parseFloat(bmi as string) < 18.5 ? 'Underweight' : 
                   parseFloat(bmi as string) < 25 ? 'Normal' : 
                   parseFloat(bmi as string) < 30 ? 'Overweight' : 'Obese'}
                </Badge>
              </div>
              <div className="bg-muted/50 p-3 rounded-lg border border-border">
                <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1 tracking-wider">BMR</p>
                <p className="text-lg font-bold">{bmr || '--'}</p>
                <p className="text-[10px] text-muted-foreground mt-1">kcal/day</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Personal Details
                </div>
                <CardDescription className="text-[13px] mt-1">Keep your physical metrics up to date.</CardDescription>
              </div>
              <Button variant={isEditing ? "default" : "outline"} size="sm" onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="text-[13px] h-8">
                {isEditing ? "Save" : "Edit"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-foreground">Full Name</Label>
                  <Input 
                    disabled={!isEditing} 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-transparent border-border text-[14px] h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-foreground">Age</Label>
                  <Input 
                    type="number" 
                    disabled={!isEditing} 
                    value={formData.age} 
                    onChange={(e) => setFormData({...formData, age: parseInt(e.target.value)})}
                    className="bg-transparent border-border text-[14px] h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-foreground">Height (cm)</Label>
                  <Input 
                    type="number" 
                    disabled={!isEditing} 
                    value={formData.height} 
                    onChange={(e) => setFormData({...formData, height: parseInt(e.target.value)})}
                    className="bg-transparent border-border text-[14px] h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-foreground">Weight (kg)</Label>
                  <Input 
                    type="number" 
                    disabled={!isEditing} 
                    value={formData.weight} 
                    onChange={(e) => setFormData({...formData, weight: parseInt(e.target.value)})}
                    className="bg-transparent border-border text-[14px] h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-foreground">Gender</Label>
                  <Select 
                    disabled={!isEditing} 
                    value={formData.gender} 
                    onValueChange={(val) => setFormData({...formData, gender: val})}
                  >
                    <SelectTrigger className="bg-transparent border-border text-[14px] h-9">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border shadow-sm bg-white">
            <CardHeader>
              <div className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Integrations
              </div>
              <CardDescription className="text-[13px] mt-1">
                AI planner key, Google Calendar and Google Tasks sync now live under the Settings tab.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
