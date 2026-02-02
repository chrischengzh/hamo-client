import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Settings, ArrowLeft, Send, Plus, User, LogOut, Trash2, Upload, Search, Compass, X, Star, Award, Clock, Loader2 } from 'lucide-react';
import apiService from './api';

const HamoClient = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [currentClient, setCurrentClient] = useState(null);
  const [activeView, setActiveView] = useState('avatars');
  const [connectedAvatars, setConnectedAvatars] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [authForm, setAuthForm] = useState({ email: '', password: '', nickname: '' });
  const [signUpInviteCode, setSignUpInviteCode] = useState('');
  const [invalidInviteCode, setInvalidInviteCode] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [settingsForm, setSettingsForm] = useState({ nickname: '', email: '', password: '', newPassword: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [invitingPro, setInvitingPro] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedProAvatar, setSelectedProAvatar] = useState(null);
  const [allProAvatars, setAllProAvatars] = useState([]);
  const [isLoadingAvatars, setIsLoadingAvatars] = useState(false);
  const chatEndRef = useRef(null);

  // Helper function to transform avatar data from API to UI format
  // v1.3.7: Using backend field names for consistency
  const transformAvatarData = (avatar) => ({
    id: avatar.id,
    pro_name: avatar.pro_name || 'Therapist',
    name: avatar.name || avatar.avatar_name || 'Avatar',
    therapeutic_approaches: avatar.therapeutic_approaches || [],
    specialty: avatar.specialty || 'N/A',
    about: avatar.about || '',
    avatar_picture: avatar.avatar_picture || null,
    last_chat_time: avatar.last_chat_time || new Date().toISOString(),
    messages: avatar.messages || [{
      id: Date.now(),
      sender: 'avatar',
      text: avatar.welcome_message || `Welcome back! I'm ${avatar.name || avatar.avatar_name || 'your therapist'}. How are you feeling today?`,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }]
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (apiService.isAuthenticated()) {
        const storedUser = apiService.getStoredUser();
        if (storedUser) {
          setCurrentClient(storedUser);
          setIsAuthenticated(true);
          // Fetch connected avatars from the new client-specific endpoint
          const result = await apiService.getConnectedAvatars();
          if (result.success && result.avatars && result.avatars.length > 0) {
            const transformedAvatars = result.avatars.map(transformAvatarData);
            setConnectedAvatars(transformedAvatars);
          } else {
            // No avatars connected yet
            setConnectedAvatars([]);
          }
        }
      }
    };
    checkAuth();
  }, []);

  // v1.3.7: Fetch real Pro Avatars from API for Discover page
  // API response: { id, name, specialty, therapeutic_approaches[], about, experience_years, experience_months, pro_name, avatar_picture }
  // Using backend field names directly for maintainability
  const fetchAllAvatars = async () => {
    setIsLoadingAvatars(true);
    try {
      const result = await apiService.getAllAvatars();
      if (result.success && result.avatars) {
        // Keep backend field names for consistency
        const transformedAvatars = result.avatars.map(avatar => {
          // Format experience from years and months (computed field)
          let experience = '';
          const years = avatar.experience_years || 0;
          const months = avatar.experience_months || 0;
          if (years > 0 && months > 0) {
            experience = `${years}y ${months}m`;
          } else if (years > 0) {
            experience = `${years} years`;
          } else if (months > 0) {
            experience = `${months} months`;
          }

          return {
            id: avatar.id,
            name: avatar.name || 'Avatar',
            pro_name: avatar.pro_name || '',
            therapeutic_approaches: avatar.therapeutic_approaches || [],
            specialty: avatar.specialty || '',
            specializations: avatar.specializations || [],
            rating: 5.0,  // default value
            sessions: 0,  // discover API doesn't return this
            experience: experience,  // computed from experience_years/months
            experience_years: avatar.experience_years || 0,
            experience_months: avatar.experience_months || 0,
            about: avatar.about || '',
            avatar_picture: avatar.avatar_picture || null
          };
        });
        setAllProAvatars(transformedAvatars);
        console.log('✅ Loaded public avatars:', transformedAvatars);
      }
    } catch (error) {
      console.error('❌ Failed to load public avatars:', error);
    } finally {
      setIsLoadingAvatars(false);
    }
  };

  // Fetch avatars when entering Discover view
  useEffect(() => {
    if (activeView === 'discover' && allProAvatars.length === 0) {
      fetchAllAvatars();
    }
  }, [activeView]);

  // v1.3.7: Get unique specialties from actual avatar data
  const getUniqueSpecialties = () => {
    const specialties = allProAvatars
      .map(avatar => avatar.specialty)
      .filter(specialty => specialty && specialty.trim() !== '');
    return [...new Set(specialties)];
  };

  // Filter Pro Avatars based on search query and selected specialty
  const getFilteredProAvatars = () => {
    let filtered = [...allProAvatars];

    // v1.3.7: Filter by specialty (not tags)
    if (selectedTag) {
      filtered = filtered.filter(avatar =>
        avatar.specialty && avatar.specialty === selectedTag
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(avatar =>
        (avatar.name && avatar.name.toLowerCase().includes(query)) ||
        (avatar.pro_name && avatar.pro_name.toLowerCase().includes(query)) ||
        (avatar.specialty && avatar.specialty.toLowerCase().includes(query)) ||
        (avatar.therapeutic_approaches && avatar.therapeutic_approaches.some(approach => approach.toLowerCase().includes(query))) ||
        (avatar.specializations && avatar.specializations.some(spec => spec.toLowerCase().includes(query)))
      );
    }

    return filtered;
  };


  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSignUp = async () => {
    console.log('🔍 Form state before trim:', {
      email: authForm.email,
      passwordLength: authForm.password?.length || 0,
      nickname: authForm.nickname,
      inviteCode: signUpInviteCode
    });

    // Trim all input values
    const email = authForm.email.trim();
    const password = authForm.password.trim();
    const nicknameInput = authForm.nickname.trim();
    const inviteCode = signUpInviteCode.trim();

    console.log('🔍 Form values after trim:', {
      email,
      passwordLength: password.length,
      nickname: nicknameInput,
      inviteCode
    });

    if (!email || !password || !inviteCode) {
      setAuthError('Please fill in all fields including the invitation code');
      return;
    }

    setIsLoading(true);
    setAuthError('');
    setInvalidInviteCode(false);

    try {
      // Use nickname from form or derive from email
      const nickname = nicknameInput || email.split('@')[0];

      console.log('📤 Calling registerClient with:', {
        nickname,
        email,
        passwordLength: password.length,
        inviteCode
      });

      const result = await apiService.registerClient(
        nickname,
        email,
        password,
        inviteCode
      );

      if (result.success) {
        setCurrentClient(result.user);

        // v1.3.6: Prefer connected_avatars array, fallback to single connected_avatar for backward compat
        if (result.connectedAvatars && result.connectedAvatars.length > 0) {
          // Use the new array format (v1.3.6+)
          console.log('✅ Connected avatars from registration (array):', result.connectedAvatars);
          const avatars = result.connectedAvatars.map(transformAvatarData);
          setConnectedAvatars(avatars);
        } else if (result.connectedAvatar) {
          // Backward compat: use single avatar format
          console.log('✅ Connected avatar from registration (single):', result.connectedAvatar);
          const avatar = transformAvatarData(result.connectedAvatar);
          setConnectedAvatars([avatar]);
        } else {
          // Fallback: fetch connected avatars from API if not returned in registration response
          console.log('🔵 No connected avatars in registration response, fetching from API...');
          const avatarsResult = await apiService.getConnectedAvatars();
          if (avatarsResult.success && avatarsResult.avatars && avatarsResult.avatars.length > 0) {
            console.log('✅ Fetched connected avatars:', avatarsResult.avatars);
            const transformedAvatars = avatarsResult.avatars.map(transformAvatarData);
            setConnectedAvatars(transformedAvatars);
          } else {
            console.log('🔵 No avatars found after registration');
            setConnectedAvatars([]);
          }
        }

        setIsAuthenticated(true);
        setShowWelcome(false);
        setAuthForm({ email: '', password: '', nickname: '' });
        setSignUpInviteCode('');
      } else {
        // Handle error - ensure it's a string
        const errorMsg = typeof result.error === 'string'
          ? result.error
          : (result.error?.message || result.error?.detail || JSON.stringify(result.error) || 'Registration failed');

        // Check if it's an invalid invitation code error
        if (errorMsg.toLowerCase().includes('invitation') || errorMsg.toLowerCase().includes('code')) {
          setInvalidInviteCode(true);
        } else {
          setAuthError(errorMsg);
        }
      }
    } catch (error) {
      setAuthError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!authForm.email || !authForm.password) {
      setAuthError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setAuthError('');

    try {
      const result = await apiService.loginClient(authForm.email, authForm.password);

      if (result.success) {
        setCurrentClient(result.user);

        // Set connected avatars from the response
        if (result.connectedAvatars && result.connectedAvatars.length > 0) {
          const avatars = result.connectedAvatars.map(transformAvatarData);
          setConnectedAvatars(avatars);
        } else {
          setConnectedAvatars([]);
        }

        setIsAuthenticated(true);
        setShowWelcome(false);
        setAuthForm({ email: '', password: '', nickname: '' });
      } else {
        setAuthError(result.error || 'Invalid email or password');
      }
    } catch (error) {
      setAuthError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedAvatar) {
      const newMessage = {
        id: Date.now(),
        sender: 'client',
        text: messageInput,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };

      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);

      const updatedAvatars = connectedAvatars.map(a => {
        if (a.id === selectedAvatar.id) {
          return {
            ...a,
            last_chat_time: new Date().toISOString(),
            messages: updatedMessages
          };
        }
        return a;
      });

      setConnectedAvatars(updatedAvatars);
      setMessageInput('');

      setTimeout(() => {
        const aiResponse = {
          id: Date.now() + 1,
          sender: 'avatar',
          text: generateAIResponse(messageInput),
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };

        const messagesWithResponse = [...updatedMessages, aiResponse];
        setMessages(messagesWithResponse);

        const avatarsWithResponse = updatedAvatars.map(a => {
          if (a.id === selectedAvatar.id) {
            return { ...a, messages: messagesWithResponse };
          }
          return a;
        });

        setConnectedAvatars(avatarsWithResponse);
      }, 1500);
    }
  };

  const generateAIResponse = (userMessage) => {
    const responses = [
      "I hear what you're saying. Can you tell me more about how that makes you feel?",
      "That's an important observation. What do you think is driving those feelings?",
      "Thank you for sharing that with me. How long have you been experiencing this?",
      "I understand this is difficult. What would help you feel better about this situation?",
      "That sounds challenging. What support do you have around you right now?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // v1.3.7: Connect with avatar via API (not just local)
  // Using backend field names for consistency
  const handleAddProAvatar = async (proAvatar) => {
    // Check if already connected
    if (connectedAvatars.find(a => a.id === proAvatar.id)) {
      alert('You are already connected with this avatar!');
      setSelectedProAvatar(null);
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiService.connectWithAvatarById(proAvatar.id);

      if (result.success) {
        // Use avatar data from API response if available, fallback to proAvatar
        const avatarData = result.avatar || proAvatar;
        const newAvatar = {
          id: avatarData.id || proAvatar.id,
          pro_name: avatarData.pro_name || proAvatar.pro_name,
          name: avatarData.name || avatarData.avatar_name || proAvatar.name,
          therapeutic_approaches: avatarData.therapeutic_approaches || proAvatar.therapeutic_approaches || [],
          specialty: avatarData.specialty || proAvatar.specialty,
          about: avatarData.about || proAvatar.about || '',
          avatar_picture: avatarData.avatar_picture || proAvatar.avatar_picture,
          last_chat_time: new Date().toISOString(),
          messages: [{
            id: Date.now(),
            sender: 'avatar',
            text: avatarData.welcome_message || `Hello! I'm ${proAvatar.name}. ${proAvatar.about || ''} I'm here to help you. How are you feeling today?`,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          }]
        };

        setConnectedAvatars([...connectedAvatars, newAvatar]);
        setSelectedProAvatar(null);
        alert('Avatar connected successfully!');
      } else {
        alert(result.error || 'Failed to connect with avatar');
      }
    } catch (error) {
      console.error('❌ Failed to connect with avatar:', error);
      alert('Failed to connect with avatar. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAvatar = async () => {
    if (!inviteCode.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiService.connectWithAvatar(inviteCode);

      if (result.success && result.avatar) {
        // Using backend field names for consistency
        const newAvatar = {
          id: result.avatar.id,
          pro_name: result.avatar.pro_name,
          name: result.avatar.name || result.avatar.avatar_name,
          therapeutic_approaches: result.avatar.therapeutic_approaches || [],
          specialty: result.avatar.specialty,
          about: result.avatar.about || '',
          avatar_picture: result.avatar.avatar_picture,
          last_chat_time: new Date().toISOString(),
          messages: [{
            id: Date.now(),
            sender: 'avatar',
            text: result.avatar.welcome_message || `Hello! I'm ${result.avatar.name || result.avatar.avatar_name}. I'm excited to work with you. How are you feeling today?`,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          }]
        };

        setConnectedAvatars([...connectedAvatars, newAvatar]);
        setInviteCode('');
        setShowInviteInput(false);
        alert('Avatar connected successfully!');
      } else {
        alert(result.error || 'Invalid invitation code');
      }
    } catch (error) {
      alert('Failed to connect with avatar. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSettings = async () => {
    setIsLoading(true);
    try {
      const profileData = {};
      if (settingsForm.nickname) profileData.nickname = settingsForm.nickname;
      if (settingsForm.email) profileData.email = settingsForm.email;
      if (settingsForm.newPassword) profileData.password = settingsForm.newPassword;

      const result = await apiService.updateProfile(profileData);

      if (result.success) {
        setCurrentClient(result.user);
        alert('Settings updated successfully!');
        setSettingsForm({ nickname: '', email: '', password: '', newPassword: '' });
      } else {
        alert(result.error || 'Failed to update settings');
      }
    } catch (error) {
      alert('Failed to update settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await apiService.logout();
    setIsAuthenticated(false);
    setCurrentClient(null);
    setConnectedAvatars([]);
    setActiveView('avatars');
    setSelectedAvatar(null);
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      const result = await apiService.deleteAccount();
      if (result.success) {
        setIsAuthenticated(false);
        setCurrentClient(null);
        setConnectedAvatars([]);
        setShowDeleteConfirm(false);
      } else {
        alert(result.error || 'Failed to delete account');
      }
    } catch (error) {
      alert('Failed to delete account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectAvatar = (avatar) => {
    setSelectedAvatar(avatar);
    setMessages(avatar.messages || []);
    setActiveView('chat');
  };

  const goBackToAvatarList = () => {
    setSelectedAvatar(null);
    setActiveView('avatars');
  };

  const sortedAvatars = [...connectedAvatars].sort((a, b) =>
    new Date(b.last_chat_time) - new Date(a.last_chat_time)
  );

  if (showWelcome && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">Welcome to Hamo</h1>
            {invitingPro && (
              <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">You've been invited by:</p>
                <p className="font-semibold text-lg">{invitingPro.proName}</p>
                <p className="text-sm text-gray-600">{invitingPro.avatarName} - {invitingPro.theory}</p>
                <div className="mt-4 p-3 bg-white rounded-lg">
                  <p className="text-sm italic text-gray-700">"{welcomeMessage}"</p>
                </div>
              </div>
            )}
            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setAuthError('');
                  setInvalidInviteCode(false);
                  setAuthForm({ email: '', password: '', nickname: '' });
                  setSignUpInviteCode('');
                }}
                className={`flex-1 py-2 rounded-lg font-medium transition ${authMode === 'signin' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setAuthError('');
                  setInvalidInviteCode(false);
                  setAuthForm({ email: '', password: '', nickname: '' });
                  setSignUpInviteCode('');
                }}
                className={`flex-1 py-2 rounded-lg font-medium transition ${authMode === 'signup' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Sign Up
              </button>
            </div>
            <div className="space-y-4">
              {(invalidInviteCode || authError) && (
                <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-800">
                        {invalidInviteCode ? 'Invalid Invitation Code' : 'Error'}
                      </h3>
                      <p className="text-sm text-red-700 mt-1">
                        {invalidInviteCode
                          ? 'Please check with your therapist for the correct invitation code.'
                          : authError}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                  <input
                    type="text"
                    value={authForm.nickname}
                    onChange={(e) => setAuthForm({ ...authForm, nickname: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Your display name"
                    disabled={isLoading}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
              {authMode === 'signup' && !invitingPro && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invitation Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={signUpInviteCode}
                    onChange={(e) => {
                      setSignUpInviteCode(e.target.value);
                      setInvalidInviteCode(false);
                      setAuthError('');
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      invalidInviteCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter code from your therapist"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Required - Get this code from your Pro therapist</p>
                </div>
              )}
              <button
                onClick={authMode === 'signin' ? handleSignIn : handleSignUp}
                disabled={isLoading}
                className="w-full bg-purple-500 text-white py-3 rounded-lg font-medium hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{authMode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                )}
              </button>
            </div>
            <div className="text-center mt-6 text-xs text-gray-400">
              Hamo Client Version 1.3.7
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">Hamo</h1>
            <p className="text-center text-gray-500 mb-8">Your Personal Therapy Companion</p>
            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => {
                  setAuthMode('signin');
                  setAuthError('');
                  setInvalidInviteCode(false);
                  setAuthForm({ email: '', password: '', nickname: '' });
                  setSignUpInviteCode('');
                }}
                className={`flex-1 py-2 rounded-lg font-medium transition ${authMode === 'signin' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthMode('signup');
                  setAuthError('');
                  setInvalidInviteCode(false);
                  setAuthForm({ email: '', password: '', nickname: '' });
                  setSignUpInviteCode('');
                }}
                className={`flex-1 py-2 rounded-lg font-medium transition ${authMode === 'signup' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Sign Up
              </button>
            </div>
            <div className="space-y-4">
              {(invalidInviteCode || authError) && (
                <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-800">
                        {invalidInviteCode ? 'Invalid Invitation Code' : 'Error'}
                      </h3>
                      <p className="text-sm text-red-700 mt-1">
                        {invalidInviteCode
                          ? 'Please check with your therapist for the correct invitation code.'
                          : authError}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                  <input
                    type="text"
                    value={authForm.nickname}
                    onChange={(e) => setAuthForm({ ...authForm, nickname: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Your display name"
                    disabled={isLoading}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your@email.com"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invitation Code <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={signUpInviteCode}
                    onChange={(e) => {
                      setSignUpInviteCode(e.target.value);
                      setInvalidInviteCode(false);
                      setAuthError('');
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      invalidInviteCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter code from your therapist"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">Required - Get this code from your Pro therapist</p>
                </div>
              )}
              <button
                onClick={authMode === 'signin' ? handleSignIn : handleSignUp}
                disabled={isLoading}
                className="w-full bg-purple-500 text-white py-3 rounded-lg font-medium hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{authMode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                )}
              </button>
            </div>
            <div className="text-center mt-6 text-xs text-gray-400">
              Hamo Client Version 1.3.7
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'chat' && selectedAvatar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-3">
              <button 
                onClick={goBackToAvatarList}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900">{selectedAvatar.name}</h2>
                <p className="text-xs text-gray-500">{selectedAvatar.pro_name}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-4">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  msg.sender === 'client' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-white shadow-sm'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className={`text-xs mt-1 ${
                    msg.sender === 'client' ? 'text-purple-100' : 'text-gray-400'
                  }`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
        </div>

        <div className="bg-white border-t border-gray-200">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                className="p-3 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="text-center pb-3 text-xs text-gray-400">
            Hamo Client Version 1.3.7
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'discover') {
    const filteredAvatars = getFilteredProAvatars();

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-24">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Discover Therapists</h1>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, specialty, or therapy type..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* Popular Specialties - dynamically from avatar data */}
          {getUniqueSpecialties().length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Popular Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {getUniqueSpecialties().map((specialty) => (
                  <button
                    key={specialty}
                    onClick={() => {
                      setSelectedTag(selectedTag === specialty ? '' : specialty);
                      setSearchQuery('');
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      selectedTag === specialty
                        ? 'bg-purple-500 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-500'
                    }`}
                  >
                    {specialty}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Pro Avatars */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              {searchQuery || selectedTag ? 'Search Results' : 'Recommended for You'}
            </h2>

            {isLoadingAvatars ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500">Loading therapists...</p>
              </div>
            ) : filteredAvatars.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Compass className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No therapists found</h3>
                <p className="text-gray-500 mb-6">{allProAvatars.length === 0 ? 'No therapists available yet' : 'Try adjusting your search or filters'}</p>
                {(searchQuery || selectedTag) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTag('');
                    }}
                    className="text-purple-500 hover:text-purple-600 font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredAvatars.map((avatar) => (
                  <div
                    key={avatar.id}
                    onClick={() => setSelectedProAvatar(avatar)}
                    className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900">{avatar.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{avatar.specialty || 'N/A'}</p>
                        <p className="text-xs text-gray-500 mb-3">{avatar.therapeutic_approaches && avatar.therapeutic_approaches.length > 0 ? avatar.therapeutic_approaches.join(' • ') : 'N/A'}</p>

                        <div className="flex items-center space-x-4 text-xs text-gray-600 mb-3">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="font-medium">{avatar.rating || 5.0}</span>
                          </div>
                          {avatar.sessions > 0 && (
                            <div className="flex items-center space-x-1">
                              <Award className="w-4 h-4" />
                              <span>{avatar.sessions} sessions</span>
                            </div>
                          )}
                          {avatar.experience && avatar.experience !== 'N/A' && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{avatar.experience}</span>
                            </div>
                          )}
                        </div>

                        {avatar.specializations && avatar.specializations.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {avatar.specializations.map((spec, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-center py-3 text-xs text-gray-400">
          Hamo Client Version 1.3.7
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-around py-3">
              <button
                onClick={() => setActiveView('avatars')}
                className="flex flex-col items-center space-y-1 px-6 py-2 text-gray-600"
              >
                <MessageSquare className="w-6 h-6" />
                <span className="text-xs">Chats</span>
              </button>
              <button
                onClick={() => setActiveView('discover')}
                className="flex flex-col items-center space-y-1 px-6 py-2 text-purple-500"
              >
                <Compass className="w-6 h-6" />
                <span className="text-xs">Discover</span>
              </button>
              <button
                onClick={() => setActiveView('settings')}
                className="flex flex-col items-center space-y-1 px-6 py-2 text-gray-600"
              >
                <Settings className="w-6 h-6" />
                <span className="text-xs">Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pro Avatar Detail Modal */}
        {selectedProAvatar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedProAvatar.name}</h3>
                      <p className="text-sm text-gray-600">{selectedProAvatar.pro_name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedProAvatar(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Specialty</h4>
                    <p className="text-gray-900">{selectedProAvatar.specialty || 'N/A'}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Therapeutic Approach</h4>
                    <p className="text-gray-900">{selectedProAvatar.therapeutic_approaches && selectedProAvatar.therapeutic_approaches.length > 0 ? selectedProAvatar.therapeutic_approaches.join(' • ') : 'N/A'}</p>
                  </div>

                  {selectedProAvatar.about && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">About</h4>
                      <p className="text-gray-700 text-sm">{selectedProAvatar.about}</p>
                    </div>
                  )}

                  <div className="flex items-center space-x-6 py-3 border-t border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <div>
                        <p className="text-lg font-bold text-gray-900">{selectedProAvatar.rating || 5.0}</p>
                        <p className="text-xs text-gray-500">Rating</p>
                      </div>
                    </div>
                    {selectedProAvatar.sessions > 0 && (
                      <div className="flex items-center space-x-2">
                        <Award className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="text-lg font-bold text-gray-900">{selectedProAvatar.sessions}</p>
                          <p className="text-xs text-gray-500">Sessions</p>
                        </div>
                      </div>
                    )}
                    {selectedProAvatar.experience && selectedProAvatar.experience !== 'N/A' && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-lg font-bold text-gray-900">{selectedProAvatar.experience}</p>
                          <p className="text-xs text-gray-500">Experience</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedProAvatar.specializations && selectedProAvatar.specializations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Specializations</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProAvatar.specializations.map((spec, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => handleAddProAvatar(selectedProAvatar)}
                    className="flex-1 bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition font-medium"
                  >
                    Add to My Therapists
                  </button>
                  <button
                    onClick={() => setSelectedProAvatar(null)}
                    className="flex-1 bg-gray-200 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (activeView === 'settings') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-24">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Connect New Avatar</h2>
            <div className="space-y-4">
              <button
                onClick={() => setShowInviteInput(!showInviteInput)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-purple-500 text-purple-500 rounded-lg hover:bg-purple-50 transition"
              >
                <Plus className="w-5 h-5" />
                <span>Add with Invite Code</span>
              </button>
              
              {showInviteInput && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Enter invite code"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddAvatar}
                      className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
                    >
                      Connect
                    </button>
                    <button
                      onClick={() => setShowInviteInput(false)}
                      className="flex-1 bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Profile Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Change Avatar</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nickname</label>
                <input
                  type="text"
                  value={settingsForm.nickname}
                  onChange={(e) => setSettingsForm({ ...settingsForm, nickname: e.target.value })}
                  placeholder={currentClient?.nickname}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={settingsForm.email}
                  onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                  placeholder={currentClient?.email}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={settingsForm.password}
                  onChange={(e) => setSettingsForm({ ...settingsForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={settingsForm.newPassword}
                  onChange={(e) => setSettingsForm({ ...settingsForm, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleUpdateSettings}
                className="w-full bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 transition font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition"
            >
              <Trash2 className="w-5 h-5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>

        <div className="text-center py-3 text-xs text-gray-400">
          Hamo Client Version 1.3.7
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-2">Delete Account</h3>
              <p className="text-gray-600 mb-6">Are you sure? This will permanently delete all your data and conversation history.</p>
              <div className="flex space-x-3">
                <button 
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  Delete
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-around py-3">
              <button
                onClick={() => setActiveView('avatars')}
                className="flex flex-col items-center space-y-1 px-6 py-2 text-gray-600"
              >
                <MessageSquare className="w-6 h-6" />
                <span className="text-xs">Chats</span>
              </button>
              <button
                onClick={() => setActiveView('discover')}
                className="flex flex-col items-center space-y-1 px-6 py-2 text-gray-600"
              >
                <Compass className="w-6 h-6" />
                <span className="text-xs">Discover</span>
              </button>
              <button
                onClick={() => setActiveView('settings')}
                className="flex flex-col items-center space-y-1 px-6 py-2 text-purple-500"
              >
                <Settings className="w-6 h-6" />
                <span className="text-xs">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-24">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Avatars</h1>
              <p className="text-sm text-gray-500">Hi, {currentClient?.nickname}</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {sortedAvatars.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Avatars Connected</h3>
            <p className="text-gray-500 mb-6">Discover and connect with therapy avatars</p>
            <button
              onClick={() => setActiveView('discover')}
              className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition"
            >
              Discover Therapists
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {sortedAvatars.map((avatar) => {
                const lastMessage = avatar.messages[avatar.messages.length - 1];
                const lastChatDate = new Date(avatar.last_chat_time);
                const today = new Date();
                const isToday = lastChatDate.toDateString() === today.toDateString();
                const timeDisplay = isToday
                  ? lastMessage?.time
                  : lastChatDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return (
                  <div
                    key={avatar.id}
                    onClick={() => selectAvatar(avatar)}
                    className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageSquare className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900">{avatar.name}</h3>
                          <span className="text-xs text-gray-400">{timeDisplay}</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">{avatar.pro_name}</p>
                        <p className="text-sm text-gray-600 truncate">
                          {lastMessage ? (
                            <span>
                              {lastMessage.sender === 'client' ? 'You: ' : ''}
                              {lastMessage.text}
                            </span>
                          ) : (
                            'No messages yet'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Discover More Button at Bottom */}
            <div className="mt-6">
              <button
                onClick={() => setActiveView('discover')}
                className="w-full bg-white border-2 border-purple-500 text-purple-500 px-6 py-4 rounded-xl hover:bg-purple-50 transition flex items-center justify-center space-x-2 font-medium shadow-sm"
              >
                <Compass className="w-5 h-5" />
                <span>Discover More Therapists</span>
              </button>
            </div>
          </>
        )}
      </div>

      <div className="text-center py-3 text-xs text-gray-400">
        Hamo Client Version 1.3.7
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <button
              onClick={() => setActiveView('avatars')}
              className="flex flex-col items-center space-y-1 px-6 py-2 text-purple-500"
            >
              <MessageSquare className="w-6 h-6" />
              <span className="text-xs">Chats</span>
            </button>
            <button
              onClick={() => setActiveView('discover')}
              className="flex flex-col items-center space-y-1 px-6 py-2 text-gray-600"
            >
              <Compass className="w-6 h-6" />
              <span className="text-xs">Discover</span>
            </button>
            <button
              onClick={() => setActiveView('settings')}
              className="flex flex-col items-center space-y-1 px-6 py-2 text-gray-600"
            >
              <Settings className="w-6 h-6" />
              <span className="text-xs">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HamoClient;
