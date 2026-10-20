import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Camera, Trash2, Calendar as CalendarIcon, Weight } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export function BodyArchive({ user }: { user: any }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state
  const [photoURL, setPhotoURL] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const archiveRef = collection(db, 'bodyArchive');
    const q = query(archiveRef, where('uid', '==', user.uid), orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'bodyArchive'));

    return () => unsubscribe();
  }, [user.uid]);

  const handleAddEntry = async () => {
    if (!photoURL) {
      toast.error("Please provide a photo URL.");
      return;
    }

    const entry = {
      uid: user.uid,
      date: format(new Date(), 'yyyy-MM-dd'),
      photoURL,
      weight: parseFloat(weight) || 0,
      notes,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, 'bodyArchive'), entry);
      toast.success("Entry added to archive!");
      setIsAdding(false);
      setPhotoURL('');
      setWeight('');
      setNotes('');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'bodyArchive');
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await deleteDoc(doc(db, 'bodyArchive', id));
      toast.success("Entry deleted.");
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `bodyArchive/${id}`);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <header className="header-section flex items-center justify-between">
        <div>
          <h2 className="text-[32px] font-bold tracking-tight text-foreground">Body Archive</h2>
          <p className="text-[14px] text-muted-foreground mt-1">Private visual tracking of your progress.</p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger render={
            <Button className="gap-2 h-9 text-[13px]">
              <Plus className="h-4 w-4" />
              New Entry
            </Button>
          } />
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Add Progress Photo</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold">Photo URL</label>
                <Input 
                  placeholder="https://example.com/photo.jpg" 
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  className="text-[14px] h-9"
                />
                <p className="text-[10px] text-muted-foreground">Tip: Use a direct link to your photo.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold">Current Weight (kg)</label>
                <Input 
                  type="number" 
                  placeholder="75.0" 
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="text-[14px] h-9"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-semibold">Notes</label>
                <Textarea 
                  placeholder="How do you feel today?" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-[14px] min-h-[80px] resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddEntry} className="w-full text-[14px]">Save Entry</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white rounded-lg border border-dashed border-border">
          <div className="bg-muted p-6 rounded-full">
            <Camera className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No photos yet</h3>
            <p className="text-[14px] text-muted-foreground">Start your visual journey today.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry) => (
            <motion.div 
              key={entry.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="overflow-hidden border border-border shadow-sm group rounded-lg">
                <div className="aspect-[3/4] relative overflow-hidden bg-muted/30">
                  <img 
                    src={entry.photoURL} 
                    alt="Progress" 
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      size="icon" 
                      variant="destructive" 
                      className="h-7 w-7 rounded-full"
                      onClick={() => deleteEntry(entry.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent text-white">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium">
                      <CalendarIcon className="h-3 w-3" />
                      {format(new Date(entry.date), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                <CardContent className="p-3 space-y-1.5">
                  {entry.weight > 0 && (
                    <div className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                      <Weight className="h-3.5 w-3.5 text-muted-foreground" />
                      {entry.weight} kg
                    </div>
                  )}
                  {entry.notes && (
                    <p className="text-[12px] text-muted-foreground line-clamp-2 italic leading-relaxed">
                      "{entry.notes}"
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
