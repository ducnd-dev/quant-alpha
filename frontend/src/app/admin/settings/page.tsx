import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">System Settings</h1>
      
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Configure general system settings for your Alpha Quant instance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site-name">Site Name</Label>
            <Input 
              id="site-name"
              defaultValue="Alpha Quant"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="site-description">Site Description</Label>
            <Textarea 
              id="site-description"
              rows={3}
              defaultValue="Advanced Quantitative Trading and Market Analysis Platform"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timezone">Time Zone</Label>
            <Select defaultValue="UTC">
              <SelectTrigger id="timezone">
                <SelectValue placeholder="Select a timezone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="UTC-8">Pacific Time (UTC-8)</SelectItem>
                <SelectItem value="UTC-5">Eastern Time (UTC-5)</SelectItem>
                <SelectItem value="UTC+1">Central European Time (UTC+1)</SelectItem>
                <SelectItem value="UTC+7">Indochina Time (UTC+7)</SelectItem>
                <SelectItem value="UTC+8">China Standard Time (UTC+8)</SelectItem>
                <SelectItem value="UTC+9">Japan Standard Time (UTC+9)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="maintenance-mode" />
            <Label htmlFor="maintenance-mode">
              Enable Maintenance Mode
            </Label>
          </div>
        </CardContent>
      </Card>
      
      {/* API Settings */}
      <Card>
        <CardHeader>
          <CardTitle>API Settings</CardTitle>
          <CardDescription>Configure API access and rate limits for external services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="flex space-x-2">
              <Input 
                id="api-key"
                type="password" 
                value="●●●●●●●●●●●●●●●●●●●●"
                disabled
                className="flex-1"
              />
              <Button variant="default">
                Regenerate
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rate-limit">Rate Limits (requests per minute)</Label>
            <Input 
              id="rate-limit"
              type="number" 
              defaultValue="60"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox id="enable-cors" defaultChecked />
            <Label htmlFor="enable-cors">
              Enable CORS
            </Label>
          </div>
        </CardContent>
      </Card>
      
      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Email Settings</CardTitle>
          <CardDescription>Configure email delivery services for notifications and alerts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="smtp-server">SMTP Server</Label>
            <Input 
              id="smtp-server"
              defaultValue="smtp.example.com"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtp-port">SMTP Port</Label>
              <Input 
                id="smtp-port"
                type="number" 
                defaultValue="587"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="encryption">Encryption</Label>
              <Select defaultValue="tls">
                <SelectTrigger id="encryption">
                  <SelectValue placeholder="Select encryption" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tls">TLS</SelectItem>
                  <SelectItem value="ssl">SSL</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email-username">Username</Label>
            <Input 
              id="email-username"
              defaultValue="notifications@alphaquant.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email-password">Password</Label>
            <Input 
              id="email-password"
              type="password" 
              defaultValue="●●●●●●●●●●●●"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sender-email">Default Sender Email</Label>
            <Input 
              id="sender-email"
              type="email" 
              defaultValue="no-reply@alphaquant.com"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <Button>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
