# AGENTS.md

This file contains development guidelines and commands for agentic coding agents working in this repository.

## Project Overview

This is a minimal setup repository for configuring the "opencode" development tool environment. The project focuses on troubleshooting and establishing proper Node.js/npm setup for the opencode CLI tool.

## Development Environment

### Platform
- **Primary**: macOS (Darwin)
- **Shell**: Bash with login shell configuration
- **Node.js**: Managed via nvm (Node Version Manager)

### Key Tools
- **opencode**: Main CLI tool (external npm package)
- **nvm**: Node Version Manager for Node.js environment
- **npm**: Node Package Manager
- **VS Code**: Primary IDE with configured terminal settings

## Commands

### Setup and Diagnostics
```bash
# Main diagnostic and setup script
./fix_opencode.sh

# Test opencode installation
opencode --version

# Start opencode server (example)
opencode --port 64096
```

### Environment Management
```bash
# Load nvm (if not already loaded)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Check npm prefix configuration
npm config get prefix

# Fix npm prefix conflicts (if set to /usr/local)
npm config delete prefix
```

### Git Operations
```bash
# Standard git operations
git status
git add .
git commit -m "description"
git push
```

## Code Style Guidelines

### Shell Scripts (Bash)
- **Shebang**: Use `#!/bin/bash`
- **Encoding**: UTF-8
- **Line endings**: LF (Unix style)
- **Indentation**: 4 spaces (no tabs)
- **Comments**: Use Chinese for user-facing messages, English for technical comments
- **Error handling**: Check command exit codes, provide meaningful error messages
- **Variables**: Use `UPPER_CASE` for environment variables, `camelCase` for local variables

### Configuration Files (JSON)
- **Formatting**: 2-space indentation
- **Quotes**: Double quotes for strings
- **Trailing commas**: Omit for single entries, include for multi-entry arrays
- **Comments**: Use JSON5-style comments where supported, otherwise document in adjacent files

### File Naming
- **Scripts**: `lowercase_with_underscores.sh` (e.g., `fix_opencode.sh`)
- **Config**: `lowercase_with_underscores.json` (e.g., `settings.json`)
- **Documentation**: `UPPER_CASE_WITH_UNDERSCORES.md` (e.g., `AGENTS.md`)

## Development Workflow

### 1. Initial Setup
1. Clone the repository
2. Run `./fix_opencode.sh` to diagnose and fix environment issues
3. Verify opencode installation with `opencode --version`
4. Open in VS Code to use configured terminal settings

### 2. Making Changes
1. Test changes in a clean terminal environment
2. Ensure scripts work with both bash and zsh
3. Verify nvm loading works correctly
4. Test on macOS (primary target platform)

### 3. Testing
- Manual testing required (no automated test framework)
- Test scripts in fresh terminal sessions
- Verify nvm and npm configurations
- Check opencode command functionality

## Error Handling Patterns

### Shell Script Error Handling
```bash
# Check for command success
if command; then
    echo "✅ Success message"
else
    echo "❌ Error message"
    exit 1
fi

# Check for file/directory existence
if [ -n "$VAR" ]; then
    echo "✅ Found: $VAR"
else
    echo "❌ Not found"
fi
```

### User Feedback
- Use emoji indicators: ✅ for success, ⚠️ for warnings, ❌ for errors
- Provide clear, actionable error messages
- Include next steps when operations fail

## Repository Structure

```
.
├── .vscode/
│   └── settings.json          # VS Code terminal configuration
├── .git/                      # Git repository
├── fix_opencode.sh           # Main diagnostic/setup script
└── AGENTS.md                  # This file - development guidelines
```

## Important Notes

### Environment Dependencies
- **nvm must be installed** at `~/.nvm/nvm.sh`
- **Node.js environment** required for opencode tool
- **macOS-specific paths** and commands in scripts

### VS Code Configuration
- Terminal configured to use workspace root as working directory
- Login shell enabled for proper environment loading
- Bash set as default terminal profile

### Script Behavior
- Scripts are designed to be self-contained and idempotent
- Error messages provide troubleshooting guidance
- Scripts handle common npm prefix conflicts automatically

## Common Issues and Solutions

### opencode Command Not Found
1. Run `./fix_opencode.sh` to diagnose
2. Ensure nvm is loaded: `source ~/.nvm/nvm.sh`
3. Check npm prefix configuration
4. Restart terminal session

### npm Prefix Conflicts
- If npm prefix is `/usr/local`, it conflicts with nvm
- Use `npm config delete prefix` to fix
- Restart terminal after changes

### Terminal Environment Issues
- Use VS Code with provided settings for consistent environment
- Ensure login shell is enabled
- Verify nvm loading in terminal startup

## Contributing Guidelines

1. **Test thoroughly**: Scripts must work in clean terminal environments
2. **Maintain compatibility**: Support both bash and zsh
3. **Document clearly**: Add comments for complex operations
4. **Handle errors gracefully**: Provide meaningful error messages
5. **Keep it minimal**: This repository focuses on setup, not feature development

## Tools and External References

- **opencode**: External CLI tool (documentation not included in this repo)
- **nvm**: Node Version Manager - https://github.com/nvm-sh/nvm
- **VS Code**: Visual Studio Code - https://code.visualstudio.com/
- **macOS Terminal**: Default terminal application with bash/zsh support