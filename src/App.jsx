import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Settings, ArrowLeft, Send, Plus, User, LogOut, Trash2, Upload, Search, Compass, X, Star, Award, Clock, Loader2, Eye, EyeOff, Globe } from 'lucide-react';
import apiService from './api';
import { translations, LanguageSwitcher, useTranslation } from './i18n.jsx';

// Hamo Logo Component (Light version without text)
const HamoLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 512 512">
    <defs>
      <mask id="hamo-smile-mask">
        <rect x="0" y="0" width="512" height="512" fill="white"/>
        <rect x="226" y="375" width="8" height="80" fill="black"/>
        <rect x="280" y="375" width="8" height="80" fill="black"/>
      </mask>
    </defs>
    {/* H: eyes (dot 1,2) */}
    <circle cx="192" cy="125" r="40" fill="#002D72"/>
    <circle cx="320" cy="125" r="40" fill="#002D72"/>
    {/* A: nose dot */}
    <circle cx="256" cy="205" r="12" fill="#002D72"/>
    {/* H: ear dots (dot 3,4) + A: dash */}
    <circle cx="88" cy="260" r="22" fill="#002D72"/>
    <rect x="130" y="236" width="252" height="48" rx="14" fill="#002D72"/>
    <circle cx="424" cy="260" r="22" fill="#002D72"/>
    {/* M: 2 dashes */}
    <rect x="152" y="318" width="96" height="40" rx="12" fill="#3572C6"/>
    <rect x="264" y="318" width="96" height="40" rx="12" fill="#3572C6"/>
    {/* O: 3-segment smile */}
    <path d="M172,394 Q256,456 340,394 Z" fill="#74B3E8" mask="url(#hamo-smile-mask)"/>
  </svg>
);

const HamoClient = () => {
  // v1.5.0: Language state (default to browser language or 'en')
  const [language, setLanguage] = useState(() => {
    const savedLang = localStorage.getItem('hamo-language');
    if (savedLang) return savedLang;
    const browserLang = navigator.language.toLowerCase();
    return browserLang.startsWith('zh') ? 'zh' : 'en';
  });
  const { t, getSpecialtyLabel, getApproachLabel } = useTranslation(language);

  // Save language preference
  useEffect(() => {
    localStorage.setItem('hamo-language', language);
  }, [language]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [currentClient, setCurrentClient] = useState(null);
  const [activeView, setActiveView] = useState('avatars');
  const [connectedAvatars, setConnectedAvatars] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [currentMindId, setCurrentMindId] = useState(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageQueue, setMessageQueue] = useState([]);
  const [isProVisible, setIsProVisible] = useState(true); // v1.4.8: Pro visibility toggle (default: visible)
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

  // v1.3.9: Fetch avatars every time entering Discover view (always refresh)
  useEffect(() => {
    if (activeView === 'discover') {
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
    // v1.3.8: Get IDs of already connected avatars
    const connectedIds = new Set(connectedAvatars.map(a => a.id));

    // Filter out already connected avatars first
    let filtered = allProAvatars.filter(avatar => !connectedIds.has(avatar.id));

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

  const handleSendMessage = async () => {
    if (messageInput.trim() && selectedAvatar && currentSessionId) {
      const userMessageText = messageInput;
      setMessageInput('');

      // Add user message to queue
      setMessageQueue(prev => [...prev, userMessageText]);

      // If not already sending, start processing queue
      if (!isSendingMessage) {
        processMessageQueue([userMessageText]);
      }
    }
  };

  // Process message queue one by one
  const processMessageQueue = async (initialQueue) => {
    setIsSendingMessage(true);
    let currentMessages = [...messages];
    let queue = [...initialQueue];

    // Add all queued user messages to UI
    const userMessages = queue.map((text, index) => ({
      id: Date.now() + index,
      sender: 'client',
      text: text,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }));
    currentMessages = [...currentMessages, ...userMessages];
    setMessages(currentMessages);

    // Add single loading indicator
    const loadingMessage = {
      id: 'loading',
      sender: 'avatar',
      text: '...',
      isLoading: true,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...currentMessages, loadingMessage]);

    // Process each message in queue
    for (let i = 0; i < queue.length; i++) {
      const userMessageText = queue[i];

      try {
        // Send message to backend and get REAL Gemini AI response
        const result = await apiService.sendMessage(currentSessionId, userMessageText, language);

        if (result.success) {
          // Use backend split messages if available, fallback to full response
          let messageBubbles;
          if (result.messages && result.messages.length > 0) {
            messageBubbles = result.messages.map(m => m.content);
          } else {
            messageBubbles = splitIntoMessageBubbles(result.response);
          }

          // Create multiple AI response bubbles
          const aiResponses = messageBubbles.map((bubble, index) => ({
            id: result.messages?.[index]?.message_id || (Date.now() + index + 1),
            sender: 'avatar',
            text: bubble,
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          }));

          // Remove loading indicator before adding responses
          currentMessages = currentMessages.filter(m => m.id !== 'loading');

          // Add AI responses
          currentMessages = [...currentMessages, ...aiResponses];

          // Re-add loading indicator if more messages in queue
          if (i < queue.length - 1) {
            const newLoadingMessage = {
              id: 'loading',
              sender: 'avatar',
              text: '...',
              isLoading: true,
              time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            };
            currentMessages = [...currentMessages, newLoadingMessage];
          }

          setMessages(currentMessages);

          console.log('✅ Real AI response received:', result.response);
        } else {
          console.error('Failed to get AI response:', result.error);
          if (i === queue.length - 1) {
            alert('Failed to send message. Please try again.');
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
        if (i === queue.length - 1) {
          alert('Failed to send message. Please check your connection.');
        }
      }
    }

    // Remove final loading indicator
    const finalMessages = currentMessages.filter(m => m.id !== 'loading');
    setMessages(finalMessages);

    // Update avatar's last chat time and messages
    const updatedAvatars = connectedAvatars.map(a => {
      if (a.id === selectedAvatar.id) {
        return {
          ...a,
          last_chat_time: new Date().toISOString(),
          messages: finalMessages
        };
      }
      return a;
    });
    setConnectedAvatars(updatedAvatars);

    // Clear queue and reset sending flag
    setMessageQueue([]);
    setIsSendingMessage(false);
  };

  // ✅ Removed hard-coded responses - now using real Gemini AI via backend API

  // Helper function to split long messages into multiple bubbles (2-3 sentences each)
  const splitIntoMessageBubbles = (text) => {
    // Don't split - show full response in one bubble
    // AI now generates concise 80-120 word responses that should stay together
    return [text.trim()];
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

  // v1.4.8: Toggle Pro visibility for current session
  const handleToggleProVisibility = async () => {
    const newVisibility = !isProVisible;
    setIsProVisible(newVisibility);

    // Update session visibility on backend
    if (currentSessionId) {
      try {
        await apiService.updateSessionVisibility(currentSessionId, newVisibility);
        console.log('✅ Pro visibility updated:', newVisibility);
      } catch (error) {
        console.error('❌ Failed to update Pro visibility:', error);
        // Revert on error
        setIsProVisible(!newVisibility);
      }
    }
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

  const selectAvatar = async (avatar) => {
    setSelectedAvatar(avatar);
    setMessages([]); // Clear messages initially, will load from backend
    setActiveView('chat');

    // Start a new session for this chat
    try {
      // Get AI Mind for this client-avatar connection
      const mindResult = await apiService.getAIMind(currentClient.id, avatar.id);
      if (mindResult.success && mindResult.mind) {
        setCurrentMindId(mindResult.mind.id);

        // Start a session
        const sessionResult = await apiService.startSession(mindResult.mind.id, avatar.id);
        if (sessionResult.success) {
          setCurrentSessionId(sessionResult.sessionId);
          console.log('✅ Session started:', sessionResult.sessionId);

          // Load message history
          const historyResult = await apiService.getSessionMessages(sessionResult.sessionId);
          if (historyResult.success && historyResult.messages && historyResult.messages.length > 0) {
            // Process messages and split long avatar responses into multiple bubbles
            const formattedMessages = [];
            historyResult.messages.forEach((msg, index) => {
              const sender = msg.role === 'user' ? 'client' : 'avatar';
              const time = new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

              if (sender === 'avatar') {
                // Split avatar messages into multiple bubbles (2-3 sentences each)
                const bubbles = splitIntoMessageBubbles(msg.content);
                bubbles.forEach((bubble, bubbleIndex) => {
                  formattedMessages.push({
                    id: `${msg.id}-${bubbleIndex}`,
                    sender: 'avatar',
                    text: bubble,
                    time: time
                  });
                });
              } else {
                // User messages stay as single bubble
                formattedMessages.push({
                  id: msg.id || `msg-${index}`,
                  sender: 'client',
                  text: msg.content,
                  time: time
                });
              }
            });
            setMessages(formattedMessages);
            console.log('📜 Loaded message history:', formattedMessages.length, 'messages');
          }
        }
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
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
            {/* v1.5.0: Language Switcher */}
            <div className="flex justify-end mb-4">
              <LanguageSwitcher language={language} setLanguage={setLanguage} />
            </div>
            <div className="flex items-center justify-center mb-6">
              <HamoLogo size={80} />
            </div>
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-4">{t('welcomeToHamo')}</h1>
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
                {t('signIn')}
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
                {t('signUp')}
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
                        {invalidInviteCode ? t('invalidInvitationCode') : t('error')}
                      </h3>
                      <p className="text-sm text-red-700 mt-1">
                        {invalidInviteCode
                          ? t('checkWithTherapist')
                          : authError}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('nickname')}</label>
                  <input
                    type="text"
                    value={authForm.nickname}
                    onChange={(e) => setAuthForm({ ...authForm, nickname: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={t('yourDisplayName')}
                    disabled={isLoading}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={t('emailPlaceholder')}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={t('passwordPlaceholder')}
                  disabled={isLoading}
                />
              </div>
              {authMode === 'signup' && !invitingPro && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('invitationCode')} <span className="text-red-500">*</span></label>
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
                    placeholder={t('enterCodeFromTherapist')}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('invitationCodeRequired')}</p>
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
                    <span>{authMode === 'signin' ? t('signingIn') : t('creatingAccount')}</span>
                  </>
                ) : (
                  <span>{authMode === 'signin' ? t('signIn') : t('createAccount')}</span>
                )}
              </button>
            </div>
            <div className="text-center mt-6 text-xs text-gray-400">
              {t('version')} 1.5.2
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
            {/* v1.5.0: Language Switcher */}
            <div className="flex justify-end mb-4">
              <LanguageSwitcher language={language} setLanguage={setLanguage} />
            </div>
            <div className="flex items-center justify-center mb-6">
              <HamoLogo size={80} />
            </div>
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">{t('hamo')}</h1>
            <p className="text-center text-gray-500 mb-8">{t('yourPersonalTherapyCompanion')}</p>
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
                {t('signIn')}
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
                {t('signUp')}
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
                        {invalidInviteCode ? t('invalidInvitationCode') : t('error')}
                      </h3>
                      <p className="text-sm text-red-700 mt-1">
                        {invalidInviteCode
                          ? t('checkWithTherapist')
                          : authError}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('nickname')}</label>
                  <input
                    type="text"
                    value={authForm.nickname}
                    onChange={(e) => setAuthForm({ ...authForm, nickname: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={t('yourDisplayName')}
                    disabled={isLoading}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={t('emailPlaceholder')}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('password')}</label>
                <input
                  type="password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={t('passwordPlaceholder')}
                  disabled={isLoading}
                />
              </div>
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('invitationCode')} <span className="text-red-500">*</span></label>
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
                    placeholder={t('enterCodeFromTherapist')}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('invitationCodeRequired')}</p>
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
                    <span>{authMode === 'signin' ? t('signingIn') : t('creatingAccount')}</span>
                  </>
                ) : (
                  <span>{authMode === 'signin' ? t('signIn') : t('createAccount')}</span>
                )}
              </button>
            </div>
            <div className="text-center mt-6 text-xs text-gray-400">
              {t('version')} 1.5.2
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'chat' && selectedAvatar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex flex-col">
        {/* v1.4.8: Fixed header bar */}
        <div className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-200 z-10">
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
              {/* v1.4.8: Pro Visibility Toggle */}
              <button
                onClick={handleToggleProVisibility}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  isProVisible
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                title={isProVisible ? t('visibleToPro') : t('hiddenFromPro')}
              >
                {isProVisible ? (
                  <>
                    <Eye className="w-4 h-4" />
                    <span>{t('visibleToPro')}</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span>{t('hiddenFromPro')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Add padding-top to account for fixed header */}
        <div className="flex-1 overflow-y-auto pb-4 pt-20">
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
                  {msg.isLoading ? (
                    <div className="flex space-x-2 py-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender === 'client' ? 'text-purple-100' : 'text-gray-400'
                      }`}>
                        {msg.time}
                      </p>
                    </>
                  )}
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
                placeholder={t('typeYourMessage')}
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
            {t('version')} 1.5.2
          </div>
        </div>
      </div>
    );
  }

  if (activeView === 'discover') {
    const filteredAvatars = getFilteredProAvatars();

    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 to-pink-50" style={{ height: '100dvh' }}>
        {/* v1.5.0: Fixed header with title, search bar and popular specialties */}
        <div className="flex-shrink-0 bg-white shadow-sm border-b border-gray-200" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="max-w-3xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('discoverTherapists')}</h1>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* v1.5.0: Popular Specialties - fixed with max 3 lines (approx 132px for 3 rows of buttons) */}
            {getUniqueSpecialties().length > 0 && (
              <div className="mt-4 pb-2">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">{t('popularSpecialties')}</h2>
                <div className="flex flex-wrap gap-2" style={{ maxHeight: '132px', overflow: 'hidden' }}>
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
          </div>
        </div>

        {/* v1.5.0: Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

          {/* Recommended Pro Avatars */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              {searchQuery || selectedTag ? t('searchResults') : t('recommendedForYou')}
            </h2>

            {isLoadingAvatars ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500">{t('loadingTherapists')}</p>
              </div>
            ) : filteredAvatars.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Compass className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noTherapistsFound')}</h3>
                <p className="text-gray-500 mb-6">{allProAvatars.length === 0 ? t('noTherapistsAvailable') : t('tryAdjustingSearch')}</p>
                {(searchQuery || selectedTag) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTag('');
                    }}
                    className="text-purple-500 hover:text-purple-600 font-medium"
                  >
                    {t('clearFilters')}
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
                        <p className="text-sm text-gray-600 mb-2">{getSpecialtyLabel(avatar.specialty) || avatar.specialty || t('na')}</p>
                        <p className="text-xs text-gray-500 mb-3">{avatar.therapeutic_approaches && avatar.therapeutic_approaches.length > 0 ? avatar.therapeutic_approaches.map(ap => getApproachLabel(ap)).join(' • ') : t('na')}</p>

                        <div className="flex items-center space-x-4 text-xs text-gray-600 mb-3">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="font-medium">{avatar.rating || 5.0}</span>
                          </div>
                          {avatar.sessions > 0 && (
                            <div className="flex items-center space-x-1">
                              <Award className="w-4 h-4" />
                              <span>{avatar.sessions} {t('sessions')}</span>
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

          <div className="text-center py-3 text-xs text-gray-400">
            {t('version')} 1.5.2
          </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-around py-3">
              <button
                onClick={() => setActiveView('avatars')}
                className="flex flex-col items-center space-y-1 px-6 py-2 text-gray-600"
              >
                <MessageSquare className="w-6 h-6" />
                <span className="text-xs">{t('chats')}</span>
              </button>
              <button
                onClick={() => setActiveView('discover')}
                className="flex flex-col items-center space-y-1 px-6 py-2 text-purple-500"
              >
                <Compass className="w-6 h-6" />
                <span className="text-xs">{t('discover')}</span>
              </button>
              <button
                onClick={() => setActiveView('settings')}
                className="flex flex-col items-center space-y-1 px-6 py-2 text-gray-600"
              >
                <Settings className="w-6 h-6" />
                <span className="text-xs">{t('settings')}</span>
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
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">{t('specialty')}</h4>
                    <p className="text-gray-900">{getSpecialtyLabel(selectedProAvatar.specialty) || selectedProAvatar.specialty || t('na')}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">{t('therapeuticApproach')}</h4>
                    <p className="text-gray-900">{selectedProAvatar.therapeutic_approaches && selectedProAvatar.therapeutic_approaches.length > 0 ? selectedProAvatar.therapeutic_approaches.map(ap => getApproachLabel(ap)).join(' • ') : t('na')}</p>
                  </div>

                  {selectedProAvatar.about && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-1">{t('about')}</h4>
                      <p className="text-gray-700 text-sm">{selectedProAvatar.about}</p>
                    </div>
                  )}

                  <div className="flex items-center space-x-6 py-3 border-t border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-yellow-400 fill-current" />
                      <div>
                        <p className="text-lg font-bold text-gray-900">{selectedProAvatar.rating || 5.0}</p>
                        <p className="text-xs text-gray-500">{t('rating')}</p>
                      </div>
                    </div>
                    {selectedProAvatar.sessions > 0 && (
                      <div className="flex items-center space-x-2">
                        <Award className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="text-lg font-bold text-gray-900">{selectedProAvatar.sessions}</p>
                          <p className="text-xs text-gray-500">{t('sessions')}</p>
                        </div>
                      </div>
                    )}
                    {selectedProAvatar.experience && selectedProAvatar.experience !== 'N/A' && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-lg font-bold text-gray-900">{selectedProAvatar.experience}</p>
                          <p className="text-xs text-gray-500">{t('experience')}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedProAvatar.specializations && selectedProAvatar.specializations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('specializations')}</h4>
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
                    {t('addToMyTherapists')}
                  </button>
                  <button
                    onClick={() => setSelectedProAvatar(null)}
                    className="flex-1 bg-gray-200 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    {t('close')}
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
      <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 to-pink-50" style={{ height: '100dvh' }}>
        {/* Fixed header */}
        <div className="flex-shrink-0 bg-white shadow-sm border-b border-gray-200" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">{t('settings')}</h1>
              {/* Language Switcher - similar to Hamo Pro */}
              <div className="flex items-center space-x-2">
                <Globe className="w-5 h-5 text-gray-400" />
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-3 py-1.5 text-sm font-medium transition ${
                      language === 'en'
                        ? 'bg-white text-gray-900'
                        : 'bg-gray-50 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => setLanguage('zh')}
                    className={`px-3 py-1.5 text-sm font-medium transition border-l border-gray-300 ${
                      language === 'zh'
                        ? 'bg-white text-blue-600'
                        : 'bg-gray-50 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    中文
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">{t('connectNewAvatar')}</h2>
            <div className="space-y-4">
              <button
                onClick={() => setShowInviteInput(!showInviteInput)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-purple-500 text-purple-500 rounded-lg hover:bg-purple-50 transition"
              >
                <Plus className="w-5 h-5" />
                <span>{t('addWithInviteCode')}</span>
              </button>

              {showInviteInput && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder={t('enterInviteCode')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleAddAvatar}
                      className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition"
                    >
                      {t('connect')}
                    </button>
                    <button
                      onClick={() => setShowInviteInput(false)}
                      className="flex-1 bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">{t('profileSettings')}</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">{t('changeAvatar')}</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('nickname')}</label>
                <input
                  type="text"
                  value={settingsForm.nickname}
                  onChange={(e) => setSettingsForm({ ...settingsForm, nickname: e.target.value })}
                  placeholder={currentClient?.nickname}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
                <input
                  type="email"
                  value={settingsForm.email}
                  onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                  placeholder={currentClient?.email}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('currentPassword')}</label>
                <input
                  type="password"
                  value={settingsForm.password}
                  onChange={(e) => setSettingsForm({ ...settingsForm, password: e.target.value })}
                  placeholder={t('passwordPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('newPassword')}</label>
                <input
                  type="password"
                  value={settingsForm.newPassword}
                  onChange={(e) => setSettingsForm({ ...settingsForm, newPassword: e.target.value })}
                  placeholder={t('passwordPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleUpdateSettings}
                className="w-full bg-purple-500 text-white px-4 py-3 rounded-lg hover:bg-purple-600 transition font-medium"
              >
                {t('saveChanges')}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 space-y-3">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('logOut')}</span>
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition"
            >
              <Trash2 className="w-5 h-5" />
              <span>{t('deleteAccount')}</span>
            </button>
          </div>

          {/* Contributors Section - marquee scrolling like Hamo Pro */}
          <div className="bg-white rounded-xl shadow-md p-4 mx-4 mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">{t('contributors')}</h3>
            <div className="overflow-hidden">
              <div className="flex animate-marquee whitespace-nowrap">
                {[...['Chris Cheng', 'Anthropic Claude', 'Kerwin Du', 'Amy Chan'], ...['Chris Cheng', 'Anthropic Claude', 'Kerwin Du', 'Amy Chan']].map((name, index) => (
                  <span key={index} className="mx-4 text-sm text-gray-400 font-medium">{name}</span>
                ))}
              </div>
            </div>
            <style>{`
              @keyframes marquee {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee {
                animation: marquee 15s linear infinite;
              }
            `}</style>
          </div>

          <div className="text-center py-4 text-xs text-gray-400">
            <p>{t('version')} 1.5.2</p>
          </div>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-2">{t('deleteAccount')}</h3>
              <p className="text-gray-600 mb-6">{t('deleteAccountConfirm')}</p>
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  {t('delete')}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-around py-3">
              <button
                onClick={() => setActiveView('avatars')}
                className="flex flex-col items-center space-y-1 px-6 py-2 text-gray-600"
              >
                <MessageSquare className="w-6 h-6" />
                <span className="text-xs">{t('chats')}</span>
              </button>
              <button
                onClick={() => setActiveView('discover')}
                className="flex flex-col items-center space-y-1 px-6 py-2 text-gray-600"
              >
                <Compass className="w-6 h-6" />
                <span className="text-xs">{t('discover')}</span>
              </button>
              <button
                onClick={() => setActiveView('settings')}
                className="flex flex-col items-center space-y-1 px-6 py-2 text-purple-500"
              >
                <Settings className="w-6 h-6" />
                <span className="text-xs">{t('settings')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 to-pink-50" style={{ height: '100dvh' }}>
      {/* Fixed header */}
      <div className="flex-shrink-0 bg-white shadow-sm border-b border-gray-200" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <HamoLogo size={44} />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{t('myAvatars')}</h1>
                <p className="text-xs text-gray-500">{t('aTherapistAvatarWithAIRealMind')}</p>
              </div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
        {sortedAvatars.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('noAvatarsConnected')}</h3>
            <p className="text-gray-500 mb-6">{t('discoverAndConnect')}</p>
            <button
              onClick={() => setActiveView('discover')}
              className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition"
            >
              {t('discoverTherapists')}
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
                  : lastChatDate.toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' });

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
                              {lastMessage.sender === 'client' ? `${t('you')}: ` : ''}
                              {lastMessage.text}
                            </span>
                          ) : (
                            t('noMessagesYet')
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
                <span>{t('discoverMoreTherapists')}</span>
              </button>
            </div>
          </>
        )}

        <div className="text-center py-3 text-xs text-gray-400">
          {t('version')} 1.5.2
        </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <button
              onClick={() => setActiveView('avatars')}
              className="flex flex-col items-center space-y-1 px-6 py-2 text-purple-500"
            >
              <MessageSquare className="w-6 h-6" />
              <span className="text-xs">{t('chats')}</span>
            </button>
            <button
              onClick={() => setActiveView('discover')}
              className="flex flex-col items-center space-y-1 px-6 py-2 text-gray-600"
            >
              <Compass className="w-6 h-6" />
              <span className="text-xs">{t('discover')}</span>
            </button>
            <button
              onClick={() => setActiveView('settings')}
              className="flex flex-col items-center space-y-1 px-6 py-2 text-gray-600"
            >
              <Settings className="w-6 h-6" />
              <span className="text-xs">{t('settings')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HamoClient;
