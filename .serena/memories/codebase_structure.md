The frontend follows a layered architecture:
- **`presentation`**: UI layer (Svelte components).
- **`application`**: Use cases and state management (Svelte stores).
- **`domain`**: Core business logic and entities.
- **`infrastructure`**: Communication with external systems (database, backend).

The backend is written in Rust and handles LLM API integration and other backend tasks.