import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Settings, ArrowLeft, Send, Camera, QrCode, Plus, User, Mail, Lock, LogOut, Trash2, Upload } from 'lucide-react';

const HamoClient = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [currentClient, setCurrentClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [activeView, setActiveView] = useState('avatars');
  const [connectedAvatars, setConnectedAvatars] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [settingsForm, setSettingsForm] = useState({ nickname: '', email: '', password: '', newPassword: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [invitingPro, setInvitingPro] = useState(null);
  const chatEndRef = useRef(null);

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

  const handleSignUp = () => {
    if (authForm.email && authForm.password) {
      if (clients.find(c => c.email === authForm.email)) {
        alert('Email already exists. Please sign in instead.');
        return;
      }
      const newClient = {
        id: Date.now(),
        email: authForm.email,
        password: authForm.password,
        nickname: authForm.email.split('@')[0],
        avatar: null,
        connectedAvatars: invitingPro ? [{
          id: Date.now(),
          proName: invitingPro.proName,
          avatarName: invitingPro.avatarName,
          theory: invitingPro.theory,
          avatarPicture: null,
          lastChatTime: new Date().toISOString(),
          messages: []
        }] : []
      };
      setClients([...clients, newClient]);
      setCurrentClient(newClient);
      setConnectedAvatars(newClient.connectedAvatars);
      setIsAuthenticated(true);
      setShowWelcome(false);
      setAuthForm({ email: '', password: '' });
      
      if (invitingPro) {
        const welcomeMsg = {
          id: Date.now(),
          sender: 'avatar',
          text: invitingPro.welcomeMessage,
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
        newClient.connectedAvatars[0].messages.push(welcomeMsg);
      }
    } else {
      alert('Please fill in all fields');
    }
  };

  const handleSignIn = () => {
    if (authForm.email && authForm.password) {
      const client = clients.find(c => c.email === authForm.email && c.password === authForm.password);
      if (client) {
        setCurrentClient(client);
        setConnectedAvatars(client.connectedAvatars || []);
        setIsAuthenticated(true);
        setShowWelcome(false);
        setAuthForm({ email: '', password: '' });
        
        if (invitingPro && !client.connectedAvatars.find(a => a.avatarName === invitingPro.avatarName)) {
          const newConnection = {
            id: Date.now(),
            proName: invitingPro.proName,
            avatarName: invitingPro.avatarName,
            theory: invitingPro.theory,
            avatarPicture: null,
            lastChatTime: new Date().toISOString(),
            messages: [{
              id: Date.now(),
              sender: 'avatar',
              text: invitingPro.welcomeMessage,
              time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            }]
          };
          client.connectedAvatars.push(newConnection);
          setConnectedAvatars(client.connectedAvatars);
          updateClientData(client);
        }
      } else {
        alert('Invalid email or password');
      }
    }
  };

  const updateClientData = (client) => {
    setClients(clients.map(c => c.id === client.id ? client : c));
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
      
      const updatedClient = {
        ...currentClient,
        connectedAvatars: updatedAvatars
      };
      setCurrentClient(updatedClient);
      updateClientData(updatedClient);

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
        
        const clientWithResponse = {
          ...updatedClient,
          connectedAvatars: avatarsWithResponse
        };
        setCurrentClient(clientWithResponse);
        updateClientData(clientWithResponse);
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

  const handleAddAvatar = () => {
    if (inviteCode.trim()) {
      const newAvatar = {
        id: Date.now(),
        proName: 'Dr. New Professional',
        avatarName: 'Therapy Bot',
        theory: 'Mindfulness-Based Therapy',
        avatarPicture: null,
        lastChatTime: new Date().toISOString(),
        messages: [{
          id: Date.now(),
          sender: 'avatar',
          text: 'Hello! I\'m excited to work with you. How are you feeling today?',
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }]
      };

      const updatedAvatars = [...connectedAvatars, newAvatar];
      setConnectedAvatars(updatedAvatars);
      
      const updatedClient = {
        ...currentClient,
        connectedAvatars: updatedAvatars
      };
      setCurrentClient(updatedClient);
      updateClientData(updatedClient);

      setInviteCode('');
      setShowInviteInput(false);
      alert('Avatar connected successfully!');
    }
  };

  const handleUpdateSettings = () => {
    const updatedClient = {
      ...currentClient,
      nickname: settingsForm.nickname || currentClient.nickname,
      email: settingsForm.email || currentClient.email,
      password: settingsForm.newPassword || currentClient.password
    };
    setCurrentClient(updatedClient);
    updateClientData(updatedClient);
    alert('Settings updated successfully!');
    setSettingsForm({ nickname: '', email: '', password: '', newPassword: '' });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentClient(null);
    setConnectedAvatars([]);
    setActiveView('avatars');
    setSelectedAvatar(null);
  };

  const handleDeleteAccount = () => {
    setClients(clients.filter(c => c.id !== currentClient.id));
    setIsAuthenticated(false);
    setCurrentClient(null);
    setConnectedAvatars([]);
    setShowDeleteConfirm(false);
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
                onClick={() => setAuthMode('signin')} 
                className={`flex-1 py-2 rounded-lg font-medium transition ${authMode === 'signin' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => setAuthMode('signup')} 
                className={`flex-1 py-2 rounded-lg font-medium transition ${authMode === 'signup' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Sign Up
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={authForm.email} 
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your@email.com"
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
                />
              </div>
              <button 
                onClick={authMode === 'signin' ? handleSignIn : handleSignUp} 
                className="w-full bg-purple-500 text-white py-3 rounded-lg font-medium hover:bg-purple-600 transition"
              >
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </div>
            <div className="text-center mt-6 text-xs text-gray-400">
              Version 1.0.0
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
                onClick={() => setAuthMode('signin')} 
                className={`flex-1 py-2 rounded-lg font-medium transition ${authMode === 'signin' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => setAuthMode('signup')} 
                className={`flex-1 py-2 rounded-lg font-medium transition ${authMode === 'signup' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                Sign Up
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  value={authForm.email} 
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} 
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="your@email.com"
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
                />
              </div>
              <button 
                onClick={authMode === 'signin' ? handleSignIn : handleSignUp} 
                className="w-full bg-purple-500 text-white py-3 rounded-lg font-medium hover:bg-purple-600 transition"
              >
                {authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
              <button 
                onClick={simulateQRCodeScan}
                className="w-full border-2 border-purple-500 text-purple-500 py-3 rounded-lg font-medium hover:bg-purple-50 transition flex items-center justify-center space-x-2"
              >
                <QrCode className="w-5 h-5" />
                <span>Scan QR Code</span>
              </button>
            </div>
            <div className="text-center mt-6 text-xs text-gray-400">
              Version 1.0.0
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
            Version 1.0.0
          </div>
        </div>
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
          Version 1.0.0
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
            <p className="text-gray-500 mb-6">Connect with a therapy avatar to start your journey</p>
            <button
              onClick={() => setActiveView('settings')}
              className="bg-purple-500 text-white px-6 py-3 rounded-lg hover:bg-purple-600 transition"
            >
              Add Avatar
            </button>
          </div>
        ) : (
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
        )}
      </div>

      <div className="text-center py-3 text-xs text-gray-400">
        Version 1.0.0
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
