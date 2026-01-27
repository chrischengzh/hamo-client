import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Settings, ArrowLeft, Send, Camera, QrCode, Plus, User, Mail, Lock, LogOut, Trash2, Upload, Search, Compass, X, Star, Award, Clock, Loader2 } from 'lucide-react';
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
  const chatEndRef = useRef(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (apiService.isAuthenticated()) {
        const storedUser = apiService.getStoredUser();
        if (storedUser) {
          setCurrentClient(storedUser);
          setIsAuthenticated(true);
          // Fetch connected avatars
          const result = await apiService.getConnectedAvatars();
          if (result.success) {
            setConnectedAvatars(result.avatars);
          }
        }
      }
    };
    checkAuth();
  }, []);

  // Mock data for Pro Avatars in the system
  const allProAvatars = [
    {
      id: 1,
      avatarName: 'Dr. Emily Chen',
      proName: 'Dr. Emily Chen, Ph.D.',
      theory: 'Cognitive Behavioral Therapy',
      specialty: 'Depression & Anxiety',
      tags: ['Depression Psychologist', 'Anxiety Specialist'],
      rating: 4.9,
      sessions: 1247,
      experience: '12 years',
      description: 'Specialized in helping individuals overcome depression and anxiety through evidence-based CBT techniques.',
      avatarPicture: null
    },
    {
      id: 2,
      avatarName: 'Dr. Marcus Brown',
      proName: 'Dr. Marcus Brown, Psy.D.',
      theory: 'Dialectical Behavior Therapy',
      specialty: 'NPD & Personality Disorders',
      tags: ['NPD Therapist', 'Personality Disorders'],
      rating: 4.8,
      sessions: 892,
      experience: '15 years',
      description: 'Expert in treating Narcissistic Personality Disorder and other personality disorders with compassionate care.',
      avatarPicture: null
    },
    {
      id: 3,
      avatarName: 'Dr. Sarah Johnson',
      proName: 'Dr. Sarah Johnson, LMFT',
      theory: 'Family Systems Therapy',
      specialty: 'Family & Couples Therapy',
      tags: ['Family Relation Therapist', 'Couples Counseling'],
      rating: 4.9,
      sessions: 1563,
      experience: '18 years',
      description: 'Helping families and couples build stronger relationships through systemic therapy approaches.',
      avatarPicture: null
    },
    {
      id: 4,
      avatarName: 'Dr. Lisa Martinez',
      proName: 'Dr. Lisa Martinez, Ph.D.',
      theory: 'Play Therapy & Child Psychology',
      specialty: 'Child & Adolescent Therapy',
      tags: ['Child Therapist', 'Adolescent Psychology'],
      rating: 5.0,
      sessions: 2104,
      experience: '20 years',
      description: 'Dedicated to supporting children and adolescents through developmental challenges and emotional difficulties.',
      avatarPicture: null
    },
    {
      id: 5,
      avatarName: 'Dr. James Wilson',
      proName: 'Dr. James Wilson, M.D.',
      theory: 'Mindfulness-Based Therapy',
      specialty: 'Stress & Burnout',
      tags: ['Stress Management', 'Burnout Recovery'],
      rating: 4.7,
      sessions: 756,
      experience: '10 years',
      description: 'Helping professionals manage stress and recover from burnout using mindfulness and meditation techniques.',
      avatarPicture: null
    },
    {
      id: 6,
      avatarName: 'Dr. Amanda Lee',
      proName: 'Dr. Amanda Lee, LCSW',
      theory: 'Trauma-Focused Therapy',
      specialty: 'PTSD & Trauma',
      tags: ['Trauma Specialist', 'PTSD Treatment'],
      rating: 4.9,
      sessions: 1328,
      experience: '14 years',
      description: 'Specializing in trauma recovery and PTSD treatment with evidence-based therapeutic approaches.',
      avatarPicture: null
    },
    {
      id: 7,
      avatarName: 'Dr. Robert Taylor',
      proName: 'Dr. Robert Taylor, Ph.D.',
      theory: 'Addiction Recovery Therapy',
      specialty: 'Substance Abuse & Addiction',
      tags: ['Addiction Therapist', 'Substance Abuse'],
      rating: 4.8,
      sessions: 945,
      experience: '16 years',
      description: 'Supporting individuals in their journey to recovery from addiction and substance abuse.',
      avatarPicture: null
    },
    {
      id: 8,
      avatarName: 'Dr. Michelle Zhang',
      proName: 'Dr. Michelle Zhang, Psy.D.',
      theory: 'Acceptance and Commitment Therapy',
      specialty: 'OCD & Anxiety Disorders',
      tags: ['OCD Specialist', 'Anxiety Disorders'],
      rating: 4.9,
      sessions: 1089,
      experience: '11 years',
      description: 'Expert in treating OCD and anxiety disorders using ACT and exposure therapy techniques.',
      avatarPicture: null
    }
  ];

  const popularTags = [
    'NPD Therapist',
    'Depression Psychologist',
    'Family Relation Therapist',
    'Child Therapist',
    'Anxiety Specialist',
    'Couples Counseling',
    'Trauma Specialist',
    'Addiction Therapist',
    'OCD Specialist',
    'Stress Management'
  ];

  // Filter Pro Avatars based on search query and selected tag
  const getFilteredProAvatars = () => {
    let filtered = [...allProAvatars];

    if (selectedTag) {
      filtered = filtered.filter(avatar => avatar.tags.includes(selectedTag));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(avatar =>
        avatar.avatarName.toLowerCase().includes(query) ||
        avatar.proName.toLowerCase().includes(query) ||
        avatar.specialty.toLowerCase().includes(query) ||
        avatar.theory.toLowerCase().includes(query) ||
        avatar.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const simulateQRCodeScan = () => {
    const mockProData = {
      proName: 'Dr. Sarah Johnson',
      avatarName: 'Dr. Compassion',
      theory: 'Cognitive Behavioral Therapy',
      welcomeMessage: 'Welcome! I\'m here to support you on your journey to better mental health. Let\'s work together to help you feel your best.'
    };
    setInvitingPro(mockProData);
    setWelcomeMessage(mockProData.welcomeMessage);
    setShowWelcome(true);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('invite')) {
      simulateQRCodeScan();
    }
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSignUp = async () => {
    if (!authForm.email || !authForm.password || !signUpInviteCode) {
      setAuthError('Please fill in all fields including the invitation code');
      return;
    }

    setIsLoading(true);
    setAuthError('');
    setInvalidInviteCode(false);

    try {
      // Use nickname from form or derive from email
      const nickname = authForm.nickname || authForm.email.split('@')[0];

      const result = await apiService.registerClient(
        nickname,
        authForm.email,
        authForm.password,
        signUpInviteCode
      );

      if (result.success) {
        setCurrentClient(result.user);

        // If there's a connected avatar from the invitation code, add it to the list
        if (result.connectedAvatar) {
          console.log('✅ Connected avatar from registration:', result.connectedAvatar);
          const avatar = {
            id: result.connectedAvatar.id,
            // Support both old and new API response formats
            proName: result.connectedAvatar.therapist_name || result.connectedAvatar.pro_name,
            avatarName: result.connectedAvatar.name || result.connectedAvatar.avatar_name,
            theory: result.connectedAvatar.theory || '',
            specialty: result.connectedAvatar.specialty || '',
            avatarPicture: result.connectedAvatar.avatar_picture || null,
            lastChatTime: new Date().toISOString(),
            messages: [{
              id: Date.now(),
              sender: 'avatar',
              text: result.connectedAvatar.welcome_message || `Hello! I'm ${result.connectedAvatar.name || result.connectedAvatar.avatar_name}. Welcome to Hamo! I'm here to support you on your journey.`,
              time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            }]
          };
          setConnectedAvatars([avatar]);
        } else {
          console.log('🔵 No connected_avatar in response');
          setConnectedAvatars([]);
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
          const avatars = result.connectedAvatars.map(avatar => ({
            id: avatar.id,
            proName: avatar.pro_name,
            avatarName: avatar.avatar_name,
            theory: avatar.theory,
            specialty: avatar.specialty,
            avatarPicture: avatar.avatar_picture,
            lastChatTime: avatar.last_chat_time || new Date().toISOString(),
            messages: avatar.messages || [{
              id: Date.now(),
              sender: 'avatar',
              text: avatar.welcome_message || `Welcome back! I'm ${avatar.avatar_name}. How are you feeling today?`,
              time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            }]
          }));
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
            lastChatTime: new Date().toISOString(),
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

  const handleAddProAvatar = (proAvatar) => {
    // Check if already connected
    if (connectedAvatars.find(a => a.id === proAvatar.id)) {
      alert('You are already connected with this avatar!');
      setSelectedProAvatar(null);
      return;
    }

    const newAvatar = {
      id: proAvatar.id,
      proName: proAvatar.proName,
      avatarName: proAvatar.avatarName,
      theory: proAvatar.theory,
      avatarPicture: proAvatar.avatarPicture,
      lastChatTime: new Date().toISOString(),
      messages: [{
        id: Date.now(),
        sender: 'avatar',
        text: `Hello! I'm ${proAvatar.avatarName}. ${proAvatar.description} I'm here to help you. How are you feeling today?`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      }]
    };

    setConnectedAvatars([...connectedAvatars, newAvatar]);
    setSelectedProAvatar(null);
    alert('Avatar connected successfully!');
  };

  const handleAddAvatar = async () => {
    if (!inviteCode.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiService.connectWithAvatar(inviteCode);

      if (result.success && result.avatar) {
        const newAvatar = {
          id: result.avatar.id,
          proName: result.avatar.pro_name,
          avatarName: result.avatar.avatar_name,
          theory: result.avatar.theory,
          specialty: result.avatar.specialty,
          avatarPicture: result.avatar.avatar_picture,
          lastChatTime: new Date().toISOString(),
          messages: [{
            id: Date.now(),
            sender: 'avatar',
            text: result.avatar.welcome_message || `Hello! I'm ${result.avatar.avatar_name}. I'm excited to work with you. How are you feeling today?`,
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
    new Date(b.lastChatTime) - new Date(a.lastChatTime)
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
                onClick={() => { setAuthMode('signin'); setAuthError(''); setInvalidInviteCode(false); }}
                className={`flex-1 py-2 rounded-lg font-medium transition ${authMode === 'signin' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthMode('signup'); setAuthError(''); setInvalidInviteCode(false); }}
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
              Version 1.2.6
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
                onClick={() => { setAuthMode('signin'); setAuthError(''); setInvalidInviteCode(false); }}
                className={`flex-1 py-2 rounded-lg font-medium transition ${authMode === 'signin' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthMode('signup'); setAuthError(''); setInvalidInviteCode(false); }}
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
              <button
                onClick={simulateQRCodeScan}
                disabled={isLoading}
                className="w-full border-2 border-purple-500 text-purple-500 py-3 rounded-lg font-medium hover:bg-purple-50 transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <QrCode className="w-5 h-5" />
                <span>Scan QR Code</span>
              </button>
            </div>
            <div className="text-center mt-6 text-xs text-gray-400">
              Version 1.2.6
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
                <h2 className="font-semibold text-gray-900">{selectedAvatar.avatarName}</h2>
                <p className="text-xs text-gray-500">{selectedAvatar.proName}</p>
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
            Version 1.2.6
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
          {/* Hot Tags */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Popular Specialties</h2>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTag(selectedTag === tag ? '' : tag);
                    setSearchQuery('');
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    selectedTag === tag
                      ? 'bg-purple-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-purple-500'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Recommended Pro Avatars */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              {searchQuery || selectedTag ? 'Search Results' : 'Recommended for You'}
            </h2>
            
            {filteredAvatars.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Compass className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No therapists found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTag('');
                  }}
                  className="text-purple-500 hover:text-purple-600 font-medium"
                >
                  Clear filters
                </button>
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
                        <h3 className="font-semibold text-lg text-gray-900">{avatar.avatarName}</h3>
                        <p className="text-sm text-gray-600 mb-2">{avatar.specialty}</p>
                        <p className="text-xs text-gray-500 mb-3">{avatar.theory}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-600 mb-3">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="font-medium">{avatar.rating}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Award className="w-4 h-4" />
                            <span>{avatar.sessions} sessions</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{avatar.experience}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {avatar.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-center py-3 text-xs text-gray-400">
          Version 1.2.6
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
                      <h3 className="text-xl font-bold text-gray-900">{selectedProAvatar.avatarName}</h3>
                      <p className="text-sm text-gray-600">{selectedProAvatar.proName}</p>
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
                    <p className="text-gray-900">{selectedProAvatar.specialty}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Therapeutic Approach</h4>
                    <p className="text-gray-900">{selectedProAvatar.theory}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">About</h4>
                    <p className="text-gray-700 text-sm">{selectedProAvatar.description}</p>
                  </div>

                  <div className="flex items-center space-x-6 py-3 border-t border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <div>
                        <p className="text-lg font-bold text-gray-900">{selectedProAvatar.rating}</p>
                        <p className="text-xs text-gray-500">Rating</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Award className="w-5 h-5 text-purple-500" />
                      <div>
                        <p className="text-lg font-bold text-gray-900">{selectedProAvatar.sessions}</p>
                        <p className="text-xs text-gray-500">Sessions</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="text-lg font-bold text-gray-900">{selectedProAvatar.experience}</p>
                        <p className="text-xs text-gray-500">Experience</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Specializations</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProAvatar.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
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

              <button
                onClick={simulateQRCodeScan}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-purple-500 text-purple-500 rounded-lg hover:bg-purple-50 transition"
              >
                <QrCode className="w-5 h-5" />
                <span>Scan QR Code</span>
              </button>
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
          Version 1.2.6
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
                const lastChatDate = new Date(avatar.lastChatTime);
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
                          <h3 className="font-semibold text-gray-900">{avatar.avatarName}</h3>
                          <span className="text-xs text-gray-400">{timeDisplay}</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-1">{avatar.proName}</p>
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
        Version 1.2.6
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
