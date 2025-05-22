# Alchemorsel Frontend

A modern Vue.js frontend for the Alchemorsel recipe management application.

## Features

- Recipe browsing and searching
- Recipe creation and editing
- User authentication
- Profile management
- Responsive design
- Dark/light theme support

## Tech Stack

- Vue 3 with Composition API
- TypeScript
- Vite
- Pinia for state management
- Vue Router
- Axios for API communication
- SCSS for styling

## Prerequisites

- Docker
- VS Code with Remote Containers extension

## Getting Started

1. Clone the repository
2. Open the project in VS Code
3. When prompted, click "Reopen in Container" to open the project in the devcontainer
4. Wait for the container to build and dependencies to install
5. Start the development server:
   ```bash
   npm run dev
   ```
6. Open http://localhost:5173 in your browser

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run test:unit` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests

## Project Structure

```
frontend/
├── src/
│   ├── assets/          # Static assets
│   ├── components/      # Reusable components
│   ├── views/          # Page components
│   ├── router/         # Route definitions
│   ├── stores/         # Pinia stores
│   ├── services/       # API services
│   ├── types/          # TypeScript definitions
│   ├── utils/          # Utility functions
│   └── styles/         # Global styles
├── tests/              # Test files
└── .devcontainer/      # Devcontainer configuration
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests and ensure they pass
4. Submit a pull request

## License

MIT 