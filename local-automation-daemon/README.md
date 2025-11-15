# 🤖 Local Automation Daemon

Local automation daemon for controlling iOS Simulator, capturing screenshots, and automating app navigation.

## 📋 Requirements

- **macOS**: 13.0+ (Ventura or newer)
- **Xcode**: 14.0+ with Command Line Tools
- **Node.js**: 18.0+
- **cliclick**: `brew install cliclick`

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env if needed

# 3. Start daemon
npm start
```

The daemon will be available at: `http://localhost:5050`

## 📡 Endpoints

### Core Endpoints

- `GET /health` - Health check
- `GET /list-simulators` - List available iOS simulators
- `POST /boot-simulator` - Boot a specific simulator
- `POST /install-app` - Install app on simulator
- `POST /launch-app` - Launch installed app

### Automation Endpoints

- `POST /tap` - Simulate tap at coordinates
- `POST /move` - Move cursor
- `POST /scroll` - Scroll gesture
- `POST /screenshot` - Capture screenshot
- `POST /run-script` - Execute navigation script

### Utility Endpoints

- `POST /resize-images` - Resize to App Store sizes
- `POST /kill-app` - Terminate app
- `POST /shutdown-simulator` - Shutdown simulator

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:5050/health

# List simulators
curl http://localhost:5050/list-simulators

# Run test suite
npm test
```

## 📚 Documentation

See `/docs/LOCAL_AUTOMATION_DAEMON.md` for complete documentation.

## 🔒 Security

- Only binds to `localhost` (not accessible from network)
- CORS restricted to `http://localhost:3000`
- Path validation to prevent directory traversal
- Command whitelisting (no arbitrary command execution)

## 📝 License

MIT
