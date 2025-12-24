import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useContracts } from "@/contexts/ContractContext";
import { Save, AlertTriangle, Lock, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

// Admin password from environment variable with fallback
const ADMIN_PASSWORD = (import.meta as any).env?.VITE_ADMIN_PASSWORD || 'admin_crowdfund_2024';

const validateAdminAccess = (password: string): boolean => {
  return password === ADMIN_PASSWORD;
};

const Settings = () => {
  const { settings, updateSettings } = useContracts();
  const [formData, setFormData] = useState(settings);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLocked) {
      toast.error("Too many failed attempts. Please try again later.");
      return;
    }

    if (validateAdminAccess(password)) {
      setIsAuthenticated(true);
      setError("");
      setAttempts(0);
      toast.success("Admin access granted");
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError("Invalid password");
      toast.error("Invalid password");
      
      if (newAttempts >= 5) {
        setIsLocked(true);
        setTimeout(() => {
          setIsLocked(false);
          setAttempts(0);
        }, 60000); // Lock for 1 minute
        toast.error("Too many failed attempts. Locked for 1 minute.");
      }
    }
  };

  const handleSave = () => {
    try {
      JSON.parse(formData.tokenABI);
      JSON.parse(formData.crowdfundingABI);
      updateSettings(formData);
      toast.success("Settings saved successfully!");
    } catch (e) {
      toast.error("Invalid JSON in ABI fields");
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-2">Admin Access Required</h1>
            <p className="text-muted-foreground">Enter the admin password to access platform settings</p>
          </div>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Admin Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={error ? "border-destructive pr-10" : "pr-10"}
                      disabled={isLocked}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {error && <p className="text-destructive text-sm">{error}</p>}
                  {isLocked && (
                    <p className="text-destructive text-sm">
                      Account locked due to too many failed attempts. Please wait 1 minute.
                    </p>
                  )}
                </div>
                <Button type="submit" variant="gradient" className="w-full" disabled={isLocked}>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Access Settings
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Platform Settings</h1>
          <p className="text-muted-foreground">Configure your smart contract addresses and ABIs</p>
        </div>

        <div className="glass-card border-yellow-500/30 bg-yellow-500/5 p-4 mb-8 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-foreground font-medium">Important</p>
            <p className="text-muted-foreground text-sm">
              These settings are stored locally. Make sure to enter valid contract addresses and ABIs for BSC Testnet.
              Set VITE_ADMIN_PASSWORD environment variable to change the admin password.
            </p>
          </div>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Token Contract</CardTitle>
            <CardDescription>Your BEP-20 token used for donations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Token Contract Address</Label>
              <Input
                placeholder="0x..."
                value={formData.tokenAddress}
                onChange={(e) => setFormData({ ...formData, tokenAddress: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Token ABI (JSON)</Label>
              <Textarea
                placeholder='[{"inputs":[],...}]'
                rows={6}
                className="font-mono text-xs"
                value={formData.tokenABI}
                onChange={(e) => setFormData({ ...formData, tokenABI: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card mt-6">
          <CardHeader>
            <CardTitle>Crowdfunding Contract</CardTitle>
            <CardDescription>The main crowdfunding smart contract</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Contract Address</Label>
              <Input
                placeholder="0x..."
                value={formData.crowdfundingAddress}
                onChange={(e) => setFormData({ ...formData, crowdfundingAddress: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Contract ABI (JSON)</Label>
              <Textarea
                placeholder='[{"inputs":[],...}]'
                rows={6}
                className="font-mono text-xs"
                value={formData.crowdfundingABI}
                onChange={(e) => setFormData({ ...formData, crowdfundingABI: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Button variant="gradient" size="lg" className="w-full mt-6" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </Layout>
  );
};

export default Settings;
