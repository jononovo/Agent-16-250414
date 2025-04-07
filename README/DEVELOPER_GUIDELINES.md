# AI Agent Workflow Platform Guidelines

## Core Principles
- **Client-centric**: Browser execution with API backend communication
- **Registry-based**: Use registries, not code modifications
- **API-first**: Well-defined interfaces between components
- **Separation**: Platform ≠ Workflows

## ✅ DO
- Use registries for components
- Follow standard interfaces
- Keep platform and workflows separate
- Use platform debugging tools

## ⚠️ DON'T
- Modify core files
- Hardcode workflows into platform
- Create special cases
- Add console.log to production
- Build custom test endpoints

## Quick Reference

**Workflow Development**
1. Use API interfaces
2. Register in workflow registry
3. Configure nodes, don't modify platform

**Node Development**
1. Register in node registry
2. Follow node interface spec
3. Keep logic in node definitions

**Troubleshooting**
- Check configurations
- Review logs
- Test components in isolation
- Never modify platform for fixes

**Anti-Patterns**
- Core code modifications
- Special case conditionals
- Code duplication
- Direct dependencies
- Debug code in production

Remember: Build ON the platform, not IN it.
