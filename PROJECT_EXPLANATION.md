# Sign Bridge — Project Explanation

## Overview

Sign Bridge is a web-based educational application designed to facilitate communication and learning for individuals with hearing and speech impairments. The application focuses on **Indian Sign Language (ISL)** and provides interactive learning modules, real-time gesture recognition, and bidirectional translation between sign language and text/speech.

## Target Audience

- Deaf and mute individuals learning to communicate through ISL
- Family members and friends of hearing-impaired individuals
- Students and educators in special education
- Anyone interested in learning Indian Sign Language

## Problem Statement

Communication barriers between hearing and non-hearing individuals remain a significant challenge. Existing resources for learning ISL are limited, often non-interactive, and lack real-time feedback. Sign Bridge addresses this gap by providing an AI-powered, interactive learning platform accessible via any modern web browser.

## Key Features

### 1. Interactive Learning Modules
- Structured curriculum covering ISL alphabet, numbers, common phrases, greetings, family signs, and more
- Each sign includes animated GIF demonstrations, step-by-step instructions, and translations in English and Hindi
- Progress tracking per lesson and per individual sign

### 2. Gesture Recognition Practice
- Real-time hand tracking using **MediaPipe Hands** computer vision
- Gesture classification using a custom **TensorFlow.js** CNN model
- Immediate visual feedback with hand landmark overlay
- Practice sessions with accuracy scoring

### 3. Text/Voice to Sign Translation
- Type text or use voice input (Web Speech API) to get ISL sign sequences
- Animated GIF playback of sign sequences with speed controls
- Support for English and Hindi input
- AI-powered assistance via Google Gemini for complex phrases

### 4. Sign to Text Translation
- Camera-based sign recognition using ML pipeline
- Real-time text output from detected signs
- Continuous detection with pause detection between signs

### 5. Quiz & Assessment System
- Multiple question types: image-to-text, text-to-image, gesture-based
- Timed quizzes with scoring and review
- Category-specific and mixed quizzes

### 6. Dashboard & Progress Tracking
- Overview stats (signs learned, streaks, quiz scores)
- Streak calendar heatmap
- Progress charts (recharts)
- AI-powered learning recommendations
- Activity feed

### 7. Accessible Design
- Mobile-first responsive layout
- High contrast mode
- Large touch targets (44x44px minimum)
- ARIA labels and keyboard navigation
- Support for screen readers

## Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | React framework with server components |
| TypeScript | Type safety |
| Tailwind CSS v4 | Utility-first styling |
| shadcn/ui | Component library (56 pre-built components) |
| Zustand | Client-side state management |
| React Hook Form + Zod | Form handling and validation |
| Recharts | Progress visualization charts |
| next-themes | Dark mode support |

### Backend & Data
| Technology | Purpose |
|---|---|
| Drizzle ORM | Type-safe database queries |
| PostgreSQL (Neon Serverless) | Cloud database |
| Clerk | Authentication and user management |
| UploadThing | File storage for sign videos/images |

### AI/ML & Computer Vision
| Technology | Purpose |
|---|---|
| MediaPipe Hands | Real-time hand tracking and landmark detection |
| TensorFlow.js | Browser-based gesture classification (custom CNN) |
| Google Gemini (gemini-2.0-flash) | AI-assisted translation and explanations |
| Web Speech API | Voice recognition and text-to-speech |

## Database Schema

12 tables covering users, content, progress, and assessments:

- **users** — Synced from Clerk, stores preferences
- **categories** — Learning categories (Alphabet, Numbers, etc.)
- **lessons** — Lessons within categories
- **signs** — Individual ISL signs with media and descriptions
- **lesson_signs** — Many-to-many: lessons ↔ signs
- **user_progress** — Per-lesson completion tracking
- **user_sign_progress** — Per-sign mastery tracking
- **quizzes** — Quiz definitions
- **quiz_questions** — Questions with multiple types
- **quiz_attempts** — User quiz results
- **streaks** — Daily activity streak tracking
- **user_activity** — Activity log for dashboard

## ML Pipeline

1. **MediaPipe Hands** detects 21 hand landmarks per hand in real-time from webcam feed
2. Landmarks are normalized (translated to wrist origin, scaled to unit bounding box)
3. Normalized landmark coordinates are flattened into a feature vector
4. Feature vector is passed through a custom **TensorFlow.js CNN model** trained on ISL gestures
5. Model outputs class probabilities; top prediction with confidence > 0.7 threshold is displayed
6. Temporal smoothing requires consistent prediction across multiple frames to reduce noise

## ISL Content

The application covers the following ISL categories:
- **Alphabet** (A-Z): 26 signs
- **Numbers** (0-9): 10 signs
- **Greetings**: Hello, Goodbye, Thank You, Sorry, Please, etc.
- **Common Phrases**: Yes, No, Help, Water, Food, etc.
- **Family**: Mother, Father, Brother, Sister, etc.
- **Colors, Days, Emergency signs**

Content is sourced from ISL reference materials. The app includes a disclaimer that ISL may have regional variations.

## Future Roadmap

- Offline support via service workers
- Additional sign languages (ASL, BSL)
- 3D avatar animations
- Community features (forums, video chat)
- Admin dashboard for content management
- Mobile app (React Native)
