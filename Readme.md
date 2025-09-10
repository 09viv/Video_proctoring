# Real-Time Video Proctoring System

A comprehensive AI-powered video proctoring solution for secure online interviews and examinations. This system provides real-time monitoring, face detection, object recognition, and detailed integrity reporting.

## 🚀 Features

### Core Monitoring Capabilities
- **Real-time Video Capture**: Live video streaming with WebRTC
- **AI-Powered Face Detection**: Monitors candidate focus and presence
- **Object Detection**: Identifies suspicious items using TensorFlow.js
- **Event Logging**: Comprehensive tracking of all proctoring events
- **Integrity Scoring**: Automated assessment based on violation severity

### Advanced Analytics
- **Live Dashboard**: Real-time monitoring of multiple sessions
- **Detailed Reports**: PDF, CSV, and JSON export capabilities
- **Session Management**: Complete session lifecycle tracking
- **Batch Processing**: Generate reports for multiple sessions

### AI Detection Features
- **Focus Tracking**: Detects when candidates look away (>5 seconds)
- **Face Presence**: Monitors for absence of faces (>10 seconds)
- **Multiple Person Detection**: Alerts for additional people in frame
- **Suspicious Object Recognition**: Identifies phones, books, laptops, etc.
- **Real-time Alerts**: Immediate notifications for violations

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **AI/ML**: TensorFlow.js, COCO-SSD Model, Face Detection API
- **Backend**: Next.js API Routes, RESTful APIs
- **Database**: In-memory storage (easily replaceable with PostgreSQL/MongoDB)
- **UI Components**: shadcn/ui, Radix UI
- **Charts**: Recharts for analytics visualization

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern web browser with camera access

### Setup Instructions

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd video-proctoring-system
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Start the development server**
   \`\`\`bash
   npm run dev

   \`\`\`

4. **Access the application**
   - Main Interface: `http://localhost:3000`
   - Admin Dashboard: `http://localhost:3000/dashboard`

## 🎯 Usage Guide

### For Candidates

1. **Start Interview Session**
   - Enter candidate information (name, email, interview type)
   - Allow camera and microphone permissions
   - Click "Start Recording" to begin proctoring

2. **During the Interview**
   - Maintain focus on the screen
   - Avoid looking away for extended periods
   - Keep the interview area clear of suspicious objects
   - Monitor the status indicators for any alerts

### For Administrators

1. **Access Dashboard**
   - Navigate to `/dashboard` for the admin interface
   - View all active and completed sessions
   - Monitor real-time statistics and alerts

2. **Generate Reports**
   - Click on any session to view detailed reports
   - Export reports in PDF, CSV, or JSON format
   - Use batch processing for multiple sessions

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:


### Detection Sensitivity

Modify detection thresholds in `components/face-detection.tsx`:

\`\`\`typescript
const FOCUS_LOSS_THRESHOLD = 5000; // 5 seconds
const NO_FACE_THRESHOLD = 10000;   // 10 seconds
const DETECTION_INTERVAL = 1000;   // 1 second
\`\`\`

## 🎨 Customization

### Styling
- Modify `app/globals.css` for global styles
- Update color scheme in Tailwind configuration
- Customize component styles in individual files

### Detection Models
- Replace TensorFlow.js models in `components/object-detection.tsx`
- Add custom object classes for specific use cases
- Adjust confidence thresholds for detection accuracy

## 🔒 Security Considerations

- **Camera Permissions**: Always request explicit user consent
- **Data Privacy**: Implement proper data encryption and storage
- **Session Security**: Use secure session tokens and HTTPS
- **Report Access**: Implement proper authentication for admin features

## 🚀 Deployment

### Vercel 
\`\`\`bash
npm run build
vercel --prod
\`\`\`



### Environment Setup
- Configure camera permissions in production
- Set up proper SSL certificates
- Configure CORS for cross-origin requests

## 📈 Performance Optimization

- **Video Processing**: Optimize frame rate and resolution
- **AI Models**: Use quantized models for better performance
- **Caching**: Implement Redis for session caching
- **CDN**: Use CDN for static assets and model files
