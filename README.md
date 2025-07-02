A pre-release JavaScript framework that uses Vue 2 as an inspiration. Available on NPM soon.

Current Features
Dependency Injection Container
Register and resolve services and components via constructor metadata or manual binding — no reflection hacks, fully tree-shakable.

Event Bus (Pub/Sub)
Decoupled communication via publish/subscribe events. Features support for asynchronous handlers and scoped channels.

Component Lifecycle Management
Built-in support for onInit, onDestroy, and onError hooks. Keeps components bootstrapped and disposable cleanly.

Configuration & Environment Support
Centralized config management and environment awareness (e.g. NODE_ENV). Supports validation and fallback mechanisms.

Minimal Core, Fully Extensible
Core is <X KB*, zero runtime dependencies. Extendable via plugins, without monolithic baggage.
