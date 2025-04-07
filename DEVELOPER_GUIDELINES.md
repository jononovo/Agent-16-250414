# Developer Guidelines for AI Agent Workflow Platform

## Table of Contents

1. [Core Architectural Principles](#core-architectural-principles)
2. [Workflow Development Guidelines](#workflow-development-guidelines)
3. [Node Development Guidelines](#node-development-guidelines)
4. [Debugging and Troubleshooting](#debugging-and-troubleshooting)
5. [Testing Guidelines](#testing-guidelines)
6. [Code Organization](#code-organization)
7. [Common Anti-Patterns to Avoid](#common-anti-patterns-to-avoid)

---

## Core Architectural Principles

### Platform Architecture

This platform follows a client-centric, API-based architecture where:

1. **Separation of Concerns**: Workflows, nodes, and agents operate as a layer on top of the core platform and should never be hardcoded into the platform itself.

2. **Registry Pattern**: All components (workflows, nodes, agents) must be registered through their respective registries, not by modifying core files.

3. **API-First Design**: Components communicate through well-defined API interfaces, not by direct internal function calls.

4. **Standardization**: All components follow the same patterns for definition, execution, and error handling.

### ⚠️ DO NOT
- Hardcode references to specific workflows, nodes, or agents in core platform code
- Modify core platform files to implement workflow-specific logic
- Create one-off solutions that bypass the established registry systems
- Add direct imports between core platform and specific workflow implementations

### ✅ DO
- Use the registry system to register new components
- Implement custom logic through the extension points provided
- Maintain clear boundaries between the platform and workflows built on it
- Leverage existing patterns for new implementations

---

## Workflow Development Guidelines

Workflows are a layer on top of the platform and should be built using the platform's API, not by modifying the platform itself.

### ⚠️ DO NOT
- Modify `server/routes.ts` to add workflow-specific endpoints
- Import workflow definition files directly into core platform code
- Create special cases in core code for specific workflows
- Add workflow-specific environment variables to the platform

### ✅ DO
- Create workflows through the established API interfaces
- Register workflows using the workflow registry
- Implement custom logic as node configurations, not platform modifications
- Document workflow requirements in the workflow metadata

### Workflow Troubleshooting

When a workflow isn't working correctly:

1. Check the workflow definition for errors
2. Examine the node configurations
3. Review the workflow execution logs
4. Test individual nodes in isolation
5. Use the proper debugging tools in the platform

**DO NOT modify platform code to fix workflow-specific issues.**

---

## Node Development Guidelines

Nodes are the building blocks of workflows and must follow standardized patterns.

### Node Development Process

1. **Use the Node Registry**: Always register new node types in the proper registry
2. **Follow the Node Interface**: Implement the standard node interface for consistency
3. **Use Type-Safe Definitions**: Leverage TypeScript for node property definitions
4. **Document Node Behavior**: Clearly document what the node does and its requirements

### ⚠️ DO NOT
- Create custom, one-off node implementations that bypass the node system
- Modify core platform files to support a specific node
- Hardcode references to specific nodes in platform code
- Implement node logic directly in route handlers

### ✅ DO
- Extend the base node classes to create new node types
- Register nodes using the node registry system
- Implement node logic within the node definition
- Use the node configuration system for customization

---

## Debugging and Troubleshooting

The platform has built-in debugging capabilities that should be used instead of modifying code for debugging.

### ⚠️ DO NOT
- Add excessive console.log statements to production code
- Modify core files to debug specific workflows or nodes
- Create custom debugging endpoints or handlers
- Leave debugging code in production

### ✅ DO
- Use the logging system with appropriate log levels
- Leverage the workflow execution inspector
- Use the node testing tools for isolated testing
- Create proper unit and integration tests

### When Stuck

If you're stuck on a problem:

1. **Document the Issue**: Clearly describe what's not working
2. **Isolate the Problem**: Determine if it's a workflow, node, or platform issue
3. **Review Logs**: Check the existing logs before adding more
4. **Test Systematically**: Test components in isolation
5. **Propose Structural Solutions**: If the platform needs enhancement, propose changes to the architecture, not one-off fixes

---

## Testing Guidelines

Testing should follow structured patterns rather than ad-hoc approaches.

### ⚠️ DO NOT
- Create one-off test routes or endpoints
- Hardcode test cases into production code
- Write tests that depend on specific workflow implementations
- Modify core files to make testing easier

### ✅ DO
- Use the provided testing utilities
- Create isolated tests for node functionality
- Test workflows through the workflow execution API
- Write unit tests for custom components
- Use mock data and services for testing

### Testing Framework

The platform provides:
- Node testing utilities
- Workflow simulation tools
- API testing endpoints
- Mock services for external dependencies

Use these instead of creating custom testing infrastructure.

---

## Code Organization

Maintain clear separation between different parts of the system.

### Platform Core
- Core platform functionality and interfaces
- Registry systems
- API definitions
- Database models and ORM

### Extensions and Plugins
- Custom node implementations
- Workflow templates
- Agent definitions
- Integration adapters

### ⚠️ DO NOT
- Mix platform code and extension code
- Create circular dependencies between core and extensions
- Add extension-specific code to core files
- Bypass the extension system

---

## Common Anti-Patterns to Avoid

The following patterns create technical debt and should be avoided:

### 1. The Quick Fix
**Anti-Pattern**: Directly modifying core platform code to fix a specific workflow issue.

**Correct Approach**: Determine why the workflow is failing and fix it through configuration or proper extension points.

### 2. The Special Case
**Anti-Pattern**: Adding if/else logic in core code to handle a specific workflow or node.

**Correct Approach**: Design nodes and workflows to work within the existing architecture.

### 3. The Copy-Paste
**Anti-Pattern**: Copying large sections of code with small modifications.

**Correct Approach**: Create proper abstraction and extension points that allow for customization.

### 4. The Dependency Web
**Anti-Pattern**: Creating direct dependencies between workflows and platform code.

**Correct Approach**: Use the registry and API systems to maintain proper separation.

### 5. The Console.log Debugger
**Anti-Pattern**: Adding numerous console.log statements in production code.

**Correct Approach**: Use structured logging through the platform's logging system.

---

## Proposing Improvements

If you identify limitations in the platform:

1. **Document the Limitation**: Clearly explain what's missing
2. **Propose a General Solution**: Design a solution that benefits all users, not just a specific case
3. **Follow Architecture Principles**: Ensure the solution maintains proper separation and follows platform patterns
4. **Create Proper Extensions**: Implement the solution as proper extensions, not core modifications

---

Remember that this platform is designed to be a framework for building workflows, not a collection of individual workflows. Maintaining this separation ensures the platform remains stable, extensible, and maintainable.
