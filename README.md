# Putzplan - Household Cleaning Task Manager

A simple, collaborative household cleaning plan with real-time synchronization between multiple devices on the local network.

This project was created entirely through vibe coding with Claude Sonnet 4.

## Features

- 📱 **Responsive Design** - Optimized for smartphone and desktop
- 🔄 **Real-time Collaboration** - Changes are broadcast live to all connected devices
- 💾 **Persistent Storage** - Tasks are automatically saved in `tasks.json`
- ✨ **Easy to Use** - Intuitive user interface
- 🏠 **Network Access** - Access from all devices on the local network

## Installation

### Prerequisites
- Node.js (Version 14 or higher)

### Setup

1. **Clone repository, install dependencies and start server**
   ```bash
   git clone <repository-url>
   cd putzplan
   npm install
   npm start
   ```

2. **Open in browser**
   - Local: http://localhost:3000
   - From other devices: http://[YOUR-IP]:3000

## Usage

### Getting Started

On first start, a `tasks.json` file is automatically created. If a `tasks.example.json` exists, it will be used as a template.

### Mobile View

On smartphones, tasks are displayed as cards for better usability:
- Large, finger-friendly buttons
- Clear card layout
- Scroll position is preserved during updates

### Collaboration

Multiple people can access the application simultaneously:
- Changes are immediately transmitted to all devices
- Current number of connected users is displayed
- No conflicts during simultaneous editing


## Browser Compatibility

In some browsers, updates cause a jump to the top of the page. A fix that remembers the scroll position has been implemented to minimize this problem.

## License

[MIT License](LICENSE)

