"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import adminService from "@/services/adminService";
import { User, UserUpdateInput } from "@/types/admin";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const userId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<UserUpdateInput>({
    name: '',
    email: '',
    password: '',
    role: 'User',
    status: 'Active'
  });

  // Fetch user details
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const userData = await adminService.getUserById(userId);
        setUser(userData);
        
        // Initialize form with user data
        setFormData({
          name: userData.name,
          email: userData.email,
          password: '', // Don't populate password field for security
          role: userData.role,
          status: userData.status
        });
      } catch (err: any) {
        console.error('Error fetching user:', err);
        setError(err.message || 'Failed to fetch user details');
        toast({
          title: "Error",
          description: "Could not load user information",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle dropdown changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Prepare data for update (remove empty password)
    const updateData: UserUpdateInput = {...formData};
    if (!updateData.password) {
      delete updateData.password;
    }
    
    try {
      await adminService.updateUser(userId, updateData);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      
      // Navigate back to users list
      router.push('/admin/users');
    } catch (err: any) {
      console.error('Error updating user:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to update user",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Navigate back to users list
  const handleBack = () => {
    router.push('/admin/users');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button onClick={handleBack} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Users
        </Button>
        
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button onClick={handleBack} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Users
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{user ? 'Edit User' : 'User Details'}</CardTitle>
          <CardDescription>
            {user ? `Editing user ${user.name} (${user.email})` : 'Loading user information...'}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password || ''}
                onChange={handleInputChange}
                placeholder="Leave blank to keep current password"
              />
              <p className="text-xs text-gray-500">
                Leave blank if you don't want to change the password
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">User Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleSelectChange('role', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Moderator">Moderator</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={handleBack}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}