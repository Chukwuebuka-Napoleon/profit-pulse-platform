import { useState } from "react";
import { Shield, Smartphone, Mail, Monitor, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const mockSessions = [
  { device: "Chrome · Windows 11", ip: "192.168.1.***", location: "New York, US", current: true },
  { device: "Safari · iPhone 15", ip: "10.0.0.***", location: "New York, US", current: false },
  { device: "Firefox · macOS", ip: "172.16.0.***", location: "London, UK", current: false },
];

export function SecurityCenter() {
  const { toast } = useToast();
  const [twoFA, setTwoFA] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);

  const handleToggle2FA = (checked: boolean) => {
    setTwoFA(checked);
    toast({
      title: checked ? "2FA Enabled" : "2FA Disabled",
      description: checked
        ? "Google Authenticator has been enabled for your account."
        : "Two-factor authentication has been disabled.",
    });
  };

  const handleToggleEmailAlerts = (checked: boolean) => {
    setEmailAlerts(checked);
    toast({
      title: checked ? "Email Alerts Enabled" : "Email Alerts Disabled",
      description: checked
        ? "You will receive email notifications for new login activity."
        : "Login email alerts have been turned off.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Security Settings</h2>
            <p className="text-sm text-muted-foreground">Manage your account protection</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="text-foreground font-medium">Google 2FA Authentication</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Secure your account with Google Authenticator
                </p>
              </div>
            </div>
            <Switch checked={twoFA} onCheckedChange={handleToggle2FA} />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="text-foreground font-medium">Email Login Alerts</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Get notified when a new device logs into your account
                </p>
              </div>
            </div>
            <Switch checked={emailAlerts} onCheckedChange={handleToggleEmailAlerts} />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Monitor className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Active Sessions</h2>
            <p className="text-sm text-muted-foreground">Devices currently logged into your account</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-3 font-medium">Device</th>
                <th className="text-left p-3 font-medium">IP Address</th>
                <th className="text-left p-3 font-medium">Location</th>
                <th className="text-left p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockSessions.map((session, i) => (
                <tr key={i} className="hover:bg-secondary/50 transition-colors">
                  <td className="p-3 text-foreground flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                    {session.device}
                  </td>
                  <td className="p-3 font-mono text-muted-foreground text-xs">{session.ip}</td>
                  <td className="p-3 text-muted-foreground flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" />
                    {session.location}
                  </td>
                  <td className="p-3">
                    {session.current ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                        Current
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
