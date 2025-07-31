# Kotonoha

Kotonoha is a desktop application designed for immersion language learning, with a focus on automating sentence mining through AI-powered analysis. It intelligently extracts vocabulary and expressions from your learning materials, helping you understand language in context.

> ⚠️ **Warning:** This application is in early development and is not yet usable. Please do not expect a stable experience.

## ✨ Features

- **AI-Powered Sentence Mining**: Automatically extract key vocabulary and expressions from sentences using Google Gemini AI, with contextual explanations tailored to your learning needs.
- **Smart Content Analysis**: Select any sentence and let AI identify important words, phrasal verbs, idioms, and collocations with detailed explanations.
- **Episode Management**: Organize your learning materials (audio + transcripts) into groups and episodes for structured study.
- **Interactive Transcript Viewer**: View synchronized transcripts with audio playback and click-to-analyze functionality.
- **Contextual Learning Cards**: Generate study cards with sentences, highlighted target expressions, and AI-generated explanations.
- **Audio-Synchronized Learning**: Listen to original audio while studying extracted vocabulary in context.

## 📥 Installation

### Prerequisites

- **Google Gemini API Key**: You'll need a Google Gemini API key to enable AI-powered sentence mining. You can obtain one from the [Google AI Studio](https://aistudio.google.com/).
- **For Linux users:** A secret service implementation (e.g., GNOME Keyring, KWallet) is required to securely store application credentials. Please ensure one is installed and configured on your system.

### Download

1. Go to the [Releases](https://github.com/your-username/kotonoha/releases) page
2. Download the appropriate installer for your operating system
3. Run the installer and follow the setup instructions

## 🚀 Getting Started

1. Launch Kotonoha
2. **Configure AI settings**: On first launch, you'll need to set up your Google Gemini API key in the settings to enable AI-powered sentence mining
3. Import your learning materials
4. Create episode groups to organize your content
5. Start studying with transcript viewing and sentence mining

## 📄 License

This project is licensed under the GPLv3. See the [LICENSE](./LICENSE) file for details.

---

## 🛠️ Development

### Tech Stack

- **Frontend**: [Svelte + SvelteKit](https://svelte.dev/)
- **Desktop App Framework**: [Tauri](https://tauri.app/)
- **Component Library**: [Flowbite Svelte](https://flowbite-svelte.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Testing**: [Vitest](https://vitest.dev/)

### Architecture

This application employs a layered architecture to separate concerns and enhance maintainability, testability, and scalability. The codebase is organized into the following layers:

- **`presentation`**: The UI layer, containing Svelte components and UI-related logic.
- **`application`**: The application layer, which orchestrates use cases and connects the UI to the domain logic.
- **`domain`**: The core of the application, containing business logic and entities.
- **`infrastructure`**: The infrastructure layer, responsible for communication with external systems like databases and APIs.

For a more detailed explanation of the architecture, please refer to [`doc/architecture.md`](./doc/architecture.md).

### Development Setup

#### Prerequisites

- [Node.js](https://nodejs.org/en/download) (v20 or later)
- [Rust](https://www.rust-lang.org/tools/install)

#### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/kotonoha.git
   cd kotonoha
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run tauri dev
   ```

### Available Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the application for production.
- `npm run test`: Runs the test suite.
- `npm run lint`: Lints the codebase for errors.
- `npm run check`: Run svelte-check to validate Svelte components.
- `npm run format`: Formats the code.
- `npm run generate:graph`: Generates a dependency graph diagram and saves it to [`doc/dependency-graph.md`](./doc/dependency-graph.md).

### Database Usage

Kotonoha uses different database files depending on the build environment:

- **Development build**: `dev.db`
- **Release build**: `app.db`

This is controlled by the `PUBLIC_APP_DB_NAME` variable set in `.env.development`. Both the TypeScript and Rust sides of the application read this variable and switch the database file accordingly.  
This ensures that development and production data are kept separate.
