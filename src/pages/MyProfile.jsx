import React, { useState, useEffect } from "react";
import { Calendar, Mail, Save, User, Lock, Upload, X } from "lucide-react";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function ProfilePage() {
  const [userData, setUserData] = useState({
    id: null,
    fullName: "",
    email: "",
    phone: "",
    avatar: "",
    role: "",
    joinedDate: "",
    emailVerified: false,
    profilePicture: null
  });

  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    email: "",
    phone: ""
  });

  const [securityInfo, setSecurityInfo] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [emailInfo, setEmailInfo] = useState({
    newEmail: "",
    currentPassword: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const getAuthToken = () => {
    return localStorage.getItem("access_token");
  };

  const fetchUserData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = getAuthToken();
      if (!token) {
        setError("Please log in to view your profile");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      console.log("Fetched user data:", data);

      const joinedDate = new Date(data.created_at).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });

      setUserData({
        id: data.id,
        fullName: data.full_name || "",
        email: data.email || "",
        phone: data.phone_number || "",
        avatar: data.full_name?.charAt(0)?.toUpperCase() || "U",
        role: data.is_superuser ? "Admin" : "User",
        joinedDate: joinedDate,
        emailVerified: data.is_verified,
        profilePicture: data.profile_picture
      });

      setPersonalInfo({
        fullName: data.full_name || "",
        email: data.email || "",
        phone: data.phone_number || ""
      });

      // Set profile picture directly (it's already a full URL from backend)
      if (data.profile_picture) {
        console.log("Setting photo preview:", data.profile_picture);
        setPhotoPreview(`${data.profile_picture}?t=${Date.now()}`);
      }

    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Unable to load profile details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalInfoChange = (e) => {
    setPersonalInfo({
      ...personalInfo,
      [e.target.name]: e.target.value
    });
    setError(null);
    setSuccessMessage(null);
  };

  const handleSecurityChange = (e) => {
    setSecurityInfo({
      ...securityInfo,
      [e.target.name]: e.target.value
    });
    setError(null);
    setSuccessMessage(null);
  };

  const handleEmailChange = (e) => {
    setEmailInfo({
      ...emailInfo,
      [e.target.name]: e.target.value
    });
    setError(null);
    setSuccessMessage(null);
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: personalInfo.fullName.trim(),
          phone_number: personalInfo.phone.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update profile");
      }

      // Update local state
      setUserData({ 
        ...userData, 
        fullName: data.full_name,
        phone: data.phone_number || "",
        avatar: data.full_name?.charAt(0)?.toUpperCase() || "U"
      });

      setSuccessMessage("Profile updated successfully!");
      
      // Dispatch event for navbar update
      window.dispatchEvent(new Event("profileInfoUpdated"));

    } catch (error) {
      console.error("Error saving changes:", error);
      setError(error.message || "Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setError(null);
    setSuccessMessage(null);

    // Validation
    if (!securityInfo.currentPassword) {
      setError("Please enter your current password");
      return;
    }

    if (!securityInfo.newPassword || !securityInfo.confirmPassword) {
      setError("Please enter and confirm your new password");
      return;
    }

    if (securityInfo.newPassword !== securityInfo.confirmPassword) {
      setError("New passwords do not match!");
      return;
    }

    if (securityInfo.newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (!/[A-Z]/.test(securityInfo.newPassword)) {
      setError("Password must contain at least one uppercase letter");
      return;
    }

    if (!/[a-z]/.test(securityInfo.newPassword)) {
      setError("Password must contain at least one lowercase letter");
      return;
    }

    if (!/[0-9]/.test(securityInfo.newPassword)) {
      setError("Password must contain at least one number");
      return;
    }

    setLoading(true);

    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/auth/update-password`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: securityInfo.currentPassword,
          new_password: securityInfo.newPassword,
          confirm_password: securityInfo.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update password");
      }

      // Clear password fields
      setSecurityInfo({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

      setSuccessMessage("Password updated successfully!");

    } catch (error) {
      console.error("Error updating password:", error);
      setError(error.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    setError(null);
    setSuccessMessage(null);

    if (!emailInfo.newEmail || !emailInfo.currentPassword) {
      setError("Please provide both new email and current password");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInfo.newEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/auth/update-email`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          new_email: emailInfo.newEmail,
          current_password: emailInfo.currentPassword,
        }),
      });

      const data = await response.json();
      console.log("Email update response:", data);

      if (!response.ok) {
        throw new Error(data.detail || "Failed to update email");
      }

      setEmailInfo({ newEmail: "", currentPassword: "" });
      setSuccessMessage("Email updated! Please check your inbox to verify your new email address. You will be logged out in 3 seconds...");
      
      // Logout after 3 seconds
      setTimeout(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }, 3000);

    } catch (error) {
      console.error("Error updating email:", error);
      setError(error.message || "Failed to update email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please upload an image file");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/auth/me/profile-picture`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      console.log("Photo upload response:", data);

      if (!response.ok) {
        throw new Error(data.detail || "Failed to upload photo");
      }

      // Update both photoPreview and userData
      if (data.profile_picture) {
        console.log("New profile picture URL:", data.profile_picture);
        setPhotoPreview(`${data.profile_picture}?t=${Date.now()}`);
        setUserData({
          ...userData,
          profilePicture: data.profile_picture
        });
      }

      setShowPhotoMenu(false);
      setSuccessMessage("Photo uploaded successfully!");
      
      // Dispatch event for navbar update
      window.dispatchEvent(new Event("profilePhotoUpdated"));

    } catch (error) {
      console.error("Error uploading photo:", error);
      setError(error.message || "Failed to upload photo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/api/auth/me/profile-picture`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log("Photo remove response:", data);

      if (!response.ok) {
        throw new Error(data.detail || "Failed to remove photo");
      }

      setPhotoPreview(null);
      setUserData({
        ...userData,
        profilePicture: null
      });
      setShowPhotoMenu(false);
      setSuccessMessage("Photo removed successfully!");
      
      // Dispatch event for navbar update
      window.dispatchEvent(new Event("profilePhotoUpdated"));

    } catch (error) {
      console.error("Error removing photo:", error);
      setError(error.message || "Failed to remove photo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !userData.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2b7fff] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 mb-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-semibold text-gray-900">Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account settings</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 pb-12">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Sidebar Card */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <div className="text-center">
                {/* Profile Photo with Menu */}
                <div className="relative inline-block mb-4">
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Profile" 
                      className="w-28 h-28 rounded-full object-cover shadow-lg"
                      onError={(e) => {
                        console.error("Image failed to load:", photoPreview);
                        e.target.onerror = null;
                      }}
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-[#2b7fff] flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {userData.avatar}
                    </div>
                  )}
                  
                  {/* Photo Upload Button */}
                  <button 
                    onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                    disabled={loading}
                    className="absolute bottom-0 right-0 bg-[#2b7fff] p-2 rounded-full text-white hover:bg-[#1a6eef] shadow-lg transition-all disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                  </button>

                  {/* Photo Menu Dropdown */}
                  {showPhotoMenu && (
                    <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 w-48 z-10">
                      <label className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Upload Photo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handlePhotoUpload}
                          disabled={loading}
                        />
                      </label>
                      {photoPreview && (
                        <button 
                          onClick={handleRemovePhoto}
                          disabled={loading}
                          className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 w-full text-left transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-600">Remove Photo</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-1">{userData.fullName}</h2>
                <p className="text-sm text-gray-500 mb-4">{userData.email}</p>
                <span className="inline-block px-4 py-1.5 bg-[#2b7fff] text-white rounded-full text-sm font-medium">
                  {userData.role}
                </span>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <span className={`flex items-center gap-1 font-medium ${
                    userData.emailVerified ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {userData.emailVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Member Since</span>
                  <span className="text-gray-900 font-medium">{userData.joinedDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-[#2b7fff]/10 rounded-lg">
                  <User className="w-5 h-5 text-[#2b7fff]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              </div>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={personalInfo.fullName}
                      onChange={handlePersonalInfoChange}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2b7fff] focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                      <span className="text-xs text-gray-500 ml-2">(Read-only)</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={personalInfo.email}
                      disabled
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={personalInfo.phone}
                    onChange={handlePersonalInfoChange}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2b7fff] focus:border-transparent outline-none transition"
                  />
                </div>
                <div className="pt-2">
                  <button 
                    onClick={handleSaveChanges}
                    disabled={loading}
                    className="w-full px-6 py-2.5 bg-[#2b7fff] text-white rounded-lg hover:bg-[#1a6eef] font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Update Information
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Email Update Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-[#2b7fff]/10 rounded-lg">
                  <Mail className="w-5 h-5 text-[#2b7fff]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Update Email Address</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Email Address</label>
                  <input
                    type="email"
                    name="newEmail"
                    value={emailInfo.newEmail}
                    onChange={handleEmailChange}
                    placeholder="Enter new email address"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2b7fff] focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={emailInfo.currentPassword}
                    onChange={handleEmailChange}
                    placeholder="Enter current password to confirm"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2b7fff] focus:border-transparent outline-none transition"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  You will need to verify your new email address before you can log in with it.
                </p>
                <div className="pt-2">
                  <button 
                    onClick={handleUpdateEmail}
                    disabled={loading}
                    className="w-full px-6 py-2.5 bg-[#2b7fff] text-white rounded-lg hover:bg-[#1a6eef] font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Updating...
                      </>
                    ) : (
                      "Update Email"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Change Password Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-[#2b7fff]/10 rounded-lg">
                  <Lock className="w-5 h-5 text-[#2b7fff]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={securityInfo.currentPassword}
                    onChange={handleSecurityChange}
                    placeholder="Enter current password"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2b7fff] focus:border-transparent outline-none transition"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={securityInfo.newPassword}
                      onChange={handleSecurityChange}
                      placeholder="Enter new password"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2b7fff] focus:border-transparent outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={securityInfo.confirmPassword}
                      onChange={handleSecurityChange}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2b7fff] focus:border-transparent outline-none transition"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Password must be at least 8 characters with uppercase, lowercase, and number
                </p>
                <div className="pt-2">
                  <button 
                    onClick={handleUpdatePassword}
                    disabled={loading}
                    className="w-full px-6 py-2.5 bg-[#2b7fff] text-white rounded-lg hover:bg-[#1a6eef] font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}