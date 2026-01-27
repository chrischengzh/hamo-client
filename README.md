# Hamo Client

**Hamo Client** is an AI-powered therapy avatar companion app that allows clients to connect with AI therapy avatars created by mental health professionals using the Hamo Pro platform.

!! The code was written entirely by AI!!

## 🌟 Features

- 🔐 **Secure Authentication**: Sign up and sign in with email and password
- 📱 **QR Code Invitations**: Connect with therapy avatars via QR code or invite code from your therapist
- 💬 **Real-time Chat**: Engage in therapeutic conversations with AI avatars
- 🎨 **Beautiful UI**: Modern, responsive design with purple/pink gradient theme
- ⚙️ **Profile Management**: Update nickname, avatar picture, email, and password
- 🔄 **Multi-Avatar Support**: Connect with multiple therapy avatars
- 📊 **Conversation History**: All chats are saved and organized by last activity

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/hamo-client.git
cd hamo-client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 📱 How It Works

### For Clients

1. **Receive Invitation**: Your therapist sends you a QR code or invite code
2. **Scan & Sign Up**: Scan the QR code and create your account
3. **Start Chatting**: Begin your therapy journey with your AI avatar
4. **Manage Profile**: Update your settings and connect with more therapists

### QR Code Flow

When you scan a QR code from Hamo Pro:
1. See a personalized welcome message from your therapist
2. Create an account or sign in
3. Automatic avatar connection is established
4. Start chatting immediately

## 🎯 Main Features

### 📬 Chat Page
- View all connected therapy avatars
- Sorted by most recent conversation
- See message previews and timestamps
- Click to open full conversation
- Real-time messaging with AI responses

### ⚙️ Settings Page
- **Add New Avatars**: Use invite codes or scan QR codes
- **Profile Settings**: 
  - Change your nickname
  - Update avatar picture
  - Change email and password
- **Account Actions**: Logout or delete account

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library

## 📂 Project Structure
```
hamo-client/
├── src/
│   ├── App.jsx              # Main application component
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles with Tailwind
├── public/                  # Static assets
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
└── README.md               # Project documentation
```

## 🎨 Color Scheme

- Primary: Purple (#A855F7) to Pink (#EC4899) gradient
- Background: Light purple to light pink gradient
- Text: Gray scale for hierarchy
- Accents: White cards with subtle shadows

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔒 Security & Privacy

- Client data is stored locally in browser state
- Passwords are handled in plain text (demo only - implement proper encryption in production)
- No external API calls in current version
- All conversations are private to the client

## 🚧 Development Status

This is a **demo/prototype** version. For production use, implement:
- [ ] Backend API integration
- [ ] Real authentication system
- [ ] Password encryption
- [ ] Database for persistent storage
- [ ] Actual QR code scanning functionality
- [ ] Real-time messaging with WebSockets
- [ ] Push notifications
- [ ] File upload for avatar pictures
- [ ] HIPAA compliance measures
- [ ] End-to-end encryption for messages

## 🔮 Future Enhancements

- Voice messaging support
- Video call integration
- Crisis intervention features
- Mood tracking and analytics
- Integration with wearable devices
- Multi-language support
- Offline mode
- Export conversation history

## 👥 Team

- **Developer**: Chris Cheng
- **Platform**: Hamo AI Therapy Platform

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

- **Project**: Hamo AI Therapy Platform
- **Email**: chris@hamo.ai
- **GitHub**: https://github.com/chrischengzh/hamo-client

## 🙏 Acknowledgments

- Built with React and Vite
- Icons by Lucide React
- Styled with Tailwind CSS
- Designed for mental health support

---

**Note**: This is a client-side application designed to work with the Hamo Pro platform. Therapists must use Hamo Pro to create and manage AI therapy avatars that clients can connect with through this app.

Built with ❤️ for better mental health support
