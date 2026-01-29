'use client';

import { useState, useEffect } from "react";
import { User } from "@/domain/entities/User";
import { getUsersAction, addCreditsAction, togglePremiumAction } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Quick Add Credit State
  const [amount, setAmount] = useState(10);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadUsers() {
    // setLoading(true);
    const res = await getUsersAction();
    if (res.success) {
      setUsers(res.data);
    } else {
      console.error(res.error);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleAddCredit(userId: string) {
    if (amount <= 0) return;
    setProcessingId(userId);
    await addCreditsAction(userId, amount);
    setProcessingId(null);
    setLoading(true); // Manually set loading before refresh
    loadUsers(); // refresh
  }

  async function handleTogglePremium(user: User) {
    setProcessingId(user.id);
    await togglePremiumAction(user.id, !user.is_premium);
    setProcessingId(null);
    loadUsers();
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                   <th className="p-4 text-left font-medium">Email</th>
                   <th className="p-4 text-left font-medium">Role</th>
                   <th className="p-4 text-left font-medium">Type</th>
                   <th className="p-4 text-left font-medium">Credits</th>
                   <th className="p-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                    <tr><td colSpan={5} className="p-4 text-center">Loading users...</td></tr>
                ) : users.map(user => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/10">
                    <td className="p-4">{user.email}</td>
                    <td className="p-4 bg-muted/20 font-mono text-xs">{user.role}</td>
                    <td className="p-4">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className={user.is_premium ? "text-yellow-600 bg-yellow-100 hover:bg-yellow-200" : "text-muted-foreground"}
                            onClick={() => handleTogglePremium(user)}
                            disabled={processingId === user.id}
                        >
                            {user.is_premium ? <Crown className="w-4 h-4 mr-1 text-yellow-600 fill-yellow-600" /> : <Crown className="w-4 h-4 mr-1" />}
                            {user.is_premium ? "Premium" : "Free"}
                        </Button>
                    </td>
                    <td className="p-4 font-bold text-green-500">{user.credits_balance}</td>
                    <td className="p-4 flex justify-end items-center gap-2">
                      <Input 
                        type="number" 
                        className="w-20 h-8" 
                        value={amount} 
                        onChange={e => setAmount(parseInt(e.target.value))}
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={processingId === user.id}
                        onClick={() => handleAddCredit(user.id)}
                      >
                        {processingId === user.id ? <Loader2 className="animate-spin w-4 h-4"/> : "Add"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
