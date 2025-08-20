# Kotonoha

Kotonoha is a desktop application for language learning, centered around AI-powered sentence mining. Import your audio and transcript files, and as you study, you can select any sentence to have the AI instantly extract and explain key vocabulary and expressions. This on-demand analysis helps you learn language in its original context. The tool is versatile enough for any learner, whether you're engaged in immersion learning, using textbook materials, preparing for tests like the TOEIC, or working with other language content.

> ⚠️ **Warning:** This application is in early development. Please do not expect a stable experience.

![Kotonoha Screenshot](doc/images/screenshots.png)

## ✨ Features

- **AI-Powered Sentence Mining**: Automatically extract key vocabulary and expressions from sentences using Google Gemini AI, with contextual explanations tailored to your learning needs.
- **Smart Content Analysis**: Select any sentence and let AI identify important words, phrasal verbs, idioms, and collocations with detailed explanations.
- **Episode Management**: Organize your learning materials (audio + transcripts) into groups and episodes for structured study.
- **Interactive Transcript Viewer**: View synchronized transcripts with audio playback and click-to-analyze functionality.
- **Contextual Learning Cards**: Generate study cards with sentences, highlighted target expressions, and AI-generated explanations.

## 🗺️ Roadmap

We are continuously working to improve Kotonoha. Here's a look at our planned features and future ideas:

### Near-term (v1.x)

- **Cross-Platform Support**: Official installers and support for Windows and macOS.
- **Audio-Synchronized Learning**: Listen to original audio while studying extracted vocabulary in context.
- **Card Management**:
  - Hide/suspend cards that you have already learned.
  - A toggle to show/hide suspended cards.
  - Functionality to unsuspend cards.
- **Anki Export**: Export your sentence cards to an Anki-compatible format (e.g., CSV).

### Future Ideas

- **Multi-language Support**: Full internationalization of the app interface, and support for a wider range of learning and explanation languages.
- **Cloud Sync**: Sync your learning data across multiple devices via services like Google Drive.
- **Mobile App**: A mobile version of the application for learning on the go.

## 📥 Installation

### Prerequisites

- **Google Gemini API Key**: You'll need a Google Gemini API key to enable AI-powered sentence mining. You can obtain one from the [Google AI Studio](https://aistudio.google.com/).
- **For Linux users:** A secret service implementation (e.g., GNOME Keyring, KWallet) is required to securely store application credentials. Please ensure one is installed and configured on your system.

### Download

1. Go to the [Releases](https://github.com/your-username/kotonoha/releases) page
2. Download the appropriate installer for your operating system
3. Run the installer and follow the setup instructions

## 🚀 Getting Started

1.  **Prepare Your Materials**:

    - Kotonoha works with pairs of audio and transcript files.
    - The audio can be in common formats like MP3, M4A, WAV, and OGG.
    - The transcript can be in either **SRT (`.srt`) format** or our original **SSWT (`.sswt`) format**. If you only have audio files, you can use our companion app [Kotonoha-ASR](https://github.com/k5n/kotonoha-asr) to generate SRT or SSWT subtitle files. Download releases from [here](https://github.com/k5n/kotonoha-asr/releases). You can also use transcription tools like [Whisper](https://github.com/openai/whisper) to generate SRT files from your audio/video content. See below for details about the SSWT format.

2.  **Launch Kotonoha**: Start the application.

3.  **Configure AI Settings**: On first launch, you'll need to set up your Google Gemini API key in the settings to enable AI-powered sentence mining.

4.  **Import Your Episode**:

    - Create an **Album** to store your episodes. You can also create Folders to organize your Albums, but episodes can only be added directly to an Album.
    - Click the "Add Episode" button within an Album and select your audio and transcript file pair (SRT or SSWT).

5.  **Start Studying**: Open an episode to view the synchronized transcript and begin your sentence mining session.

## 📄 Supported Subtitle Formats

Kotonoha supports the following subtitle formats:

### SRT (SubRip Subtitle)

The standard SRT format is widely used and compatible with most subtitle tools. Each entry consists of a sequence number, a time range, and the subtitle text.

### SSWT (Simple Subtitle With Timestamps)

SSWT is a simple, original format designed for Kotonoha. Each line represents a single subtitle and includes a time range and the text:

```
[HH:MM:SS.mmm -> HH:MM:SS.mmm] Subtitle text here
```

- `HH:MM:SS.mmm` is the start and end time (hours:minutes:seconds.milliseconds)
- `->` separates the start and end times
- The subtitle text follows after the time range

**Example:**

```
[00:00:01.000 -> 00:00:02.500] This is a test sentence.
[00:00:05.500 -> 00:00:07.000] And here is line two.
[00:00:07.100 -> 00:00:09.900] Finally, the third line.
```

**Note:** SSWT is a Kotonoha-specific format and is not compatible with other subtitle tools. SRT remains fully supported for interoperability.

**Automatic Speech Recognition (ASR):**
Kotonoha does not include built-in ASR functionality. If you only have audio files, please use our companion app [Kotonoha-ASR](https://github.com/k5n/kotonoha-asr) to generate SRT or SSWT subtitle files. Download releases from [here](https://github.com/k5n/kotonoha-asr/releases).

---

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

### Building AppImage Locally on Linux (for Developers)

If you are developing on Linux, you can build the AppImage package locally using Docker and Docker Compose. This provides a reproducible environment similar to the official GitHub Actions workflow.

#### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

#### Steps

1. **Set your user ID and group ID**

   To ensure build artifacts are owned by your user, create a `.env` file in the project root with your UID and GID:

   ```sh
   echo "UID=$(id -u)" > .env
   echo "GID=$(id -g)" >> .env
   ```

2. **Build and run the container**

   ```sh
   docker-compose up
   ```

   This will install all dependencies, build the project, and generate the AppImage file in `src-tauri/target/release/bundle/appimage`.

3. **Check the build output**

   The build progress will be shown in your terminal. After completion, you can find the generated `.AppImage` file in the above directory.

#### Notes

- This workflow is intended for **local development only**. Official release builds are performed by GitHub Actions.
- The container uses your UID/GID to avoid permission issues with build artifacts.
- If you encounter permission errors related to Rust or Node.js, ensure your UID/GID are set correctly in `.env`.

If you build the AppImage without using the provided Docker environment (Ubuntu 22.04), you may encounter issues related to WebKitGTK version compatibility (such as problems with WebKitGTK 2.48).

References:

- [Tauri GitHub issue #9662](https://github.com/tauri-apps/tauri/issues/9662)
- [Tauri GitHub issue #13183](https://github.com/tauri-apps/tauri/issues/13183)
- [Tauri GitHub issue #13204](https://github.com/tauri-apps/tauri/issues/13204)
- [Tauri GitHub issue #13899](https://github.com/tauri-apps/tauri/issues/13899)
- [Tauri GitHub issue #13885](https://github.com/tauri-apps/tauri/issues/13885)
