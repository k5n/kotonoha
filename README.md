# Kotonoha

Kotonoha is a desktop application designed for language learning, with a focus on acquiring vocabulary and understanding through context. It allows users to import media, manage episodes, view transcripts, and create sentence cards for study.

> ⚠️ **Warning:** This application is in early development and is not yet usable. Please do not expect a stable

## ✨ Features

- **Episode Management**: Organize your learning materials into groups and episodes.
- **Transcript Viewer**: View and interact with dialogue transcripts.
- **Sentence Mining**: Create vocabulary and sentence cards from transcripts.
- **Audio Playback**: Listen to audio associated with dialogues and sentences.

## 🛠️ Tech Stack

- **Frontend**: [Svelte + SvelteKit](https://svelte.dev/)
- **Desktop App Framework**: [Tauri](https://tauri.app/)
- **Component Library**: [Flowbite Svelte](https://flowbite-svelte.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Testing**: [Vitest](https://vitest.dev/)

## 🏛️ Architecture

This application employs a layered architecture to separate concerns and enhance maintainability, testability, and scalability. The codebase is organized into the following layers:

- **`presentation`**: The UI layer, containing Svelte components and UI-related logic.
- **`application`**: The application layer, which orchestrates use cases and connects the UI to the domain logic.
- **`domain`**: The core of the application, containing business logic and entities.
- **`infrastructure`**: The infrastructure layer, responsible for communication with external systems like databases and APIs.

For a more detailed explanation of the architecture, please refer to [`doc/architecture.md`](./doc/architecture.md).

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v20 or later)
- [Rust](https://www.rust-lang.org/tools/install)
- **For Linux users:** A secret service implementation (e.g., GNOME Keyring, KWallet) is required to securely store application credentials. Please ensure one is installed and configured on your system.

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/your-username/kotonoha.git
    cd kotonoha
    ```

2.  Install the dependencies:

    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run tauri dev
    ```

## 📜 Available Scripts

- `npm run tauri dev`: Starts the development server.
- `npm run tauri build`: Builds the application for production.
- `npm run test`: Runs the test suite.
- `npm run lint`: Lints the codebase for errors.
- `npm run format`: Formats the code.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## 🗄️ Database Usage

Kotonoha uses different database files depending on the build environment:

- **Development build**: `dev.db`
- **Release build**: `app.db`

This is controlled by the `PUBLIC_APP_DB_NAME` variable set in `.env.development` and `.env.production`. Both the TypeScript and Rust sides of the application read this variable and switch the database file accordingly.  
This ensures that development and production data are kept separate.
