'use client';

import { useState, useEffect } from "react";
import { getSystemConfigsAction, updateSystemConfigAction } from "@/app/actions/config";
import { getDebugInfoAction } from "@/app/actions/debug";
import { FeatureConfig } from "@/domain/entities/Config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { Label } from "@/components/ui/label";

// Helper Component for Feature Select
function FeatureSelect({ 
  label, 
  value, 
  onChange, 
  options = ['enabled', 'disabled', 'premium'] 
}: { 
  label: string, 
  value: string, 
  onChange: (val: string) => void,
  options?: string[]
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
      <div className="space-y-0.5">
        <Label className="text-base font-medium">{label}</Label>
      </div>
      <div className="flex items-center space-x-2">
         <select 
           value={value} 
           onChange={(e) => onChange(e.target.value)}
           className="h-9 w-[150px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
         >
           {options.map(opt => (
             <option key={opt} value={opt} className="bg-background">
               {opt.charAt(0).toUpperCase() + opt.slice(1)}
             </option>
           ))}
         </select>
      </div>
    </div>
  );
}

export default function ConfigurationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<FeatureConfig | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  async function loadConfig() {
    // setLoading(true); // Don't set true here to avoid useEffect warning. Rely on initial state or manual set before call.
    const res = await getSystemConfigsAction();
    if (res.success) {
      setConfig(res.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadConfig();
    getDebugInfoAction().then(setDebugInfo);
  }, []);

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    const res = await updateSystemConfigAction(config);
    if (res.success) {
      alert("Configuration saved successfully"); // Basic feedback
    } else {
      alert("Failed to save: " + res.error);
    }
    setSaving(false);
  }

  const updateField = (key: keyof FeatureConfig, val: string) => {
    if (!config) return;
    setConfig({ ...config, [key]: val as any });
  };

  if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>;
  if (!config) return <div className="p-8">Failed to load config</div>;

  return (
    <div className="container mx-auto p-8 max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      {debugInfo && (
        <Card className="bg-slate-50 border-orange-200">
           <CardHeader><CardTitle className="text-sm">Debug Info</CardTitle></CardHeader>
           <CardContent>
             <pre className="text-xs overflow-auto max-h-[200px]">
               {JSON.stringify(debugInfo, null, 2)}
             </pre>
           </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Feature Flags & Access Control</CardTitle>
          <CardDescription>
            Configure which features are active and which are locked behind Premium tier.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FeatureSelect 
            label="Text to Image (Basic)" 
            value={config.text_to_image} 
            onChange={(v) => updateField('text_to_image', v)}
            options={['enabled', 'disabled']}
          />
          <FeatureSelect 
            label="Hires Fix (Upscaler)" 
            value={config.hires_fix} 
            onChange={(v) => updateField('hires_fix', v)}
          />
          <FeatureSelect 
            label="LoRA Support" 
            value={config.lora} 
            onChange={(v) => updateField('lora', v)}
          />
          <FeatureSelect 
            label="Refiner Model" 
            value={config.refiner} 
            onChange={(v) => updateField('refiner', v)}
          />
          <FeatureSelect 
            label="History & Gallery" 
            value={config.history} 
            onChange={(v) => updateField('history', v)}
          />
          <FeatureSelect 
            label="Custom Resolutions" 
            value={config.custom_resolutions} 
            onChange={(v) => updateField('custom_resolutions', v)}
          />
        </CardContent>
      </Card>
      
      {/* Additional sections for Pricing, etc. can be added here */}
    </div>
  );
}
