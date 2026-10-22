# Axon: The Cognitive Browser Assistant

**Axon** is an intelligent Chrome, Firefox & Edge extension that acts as your browser's "Digital Twin". It integrates state-of-the-art AI (bring your own key — Gemini, Groq, or OpenAI) to see what you see, understand your context, and automate tedious web tasks.

## 🚀 Features

### 👁️ **Vision Analysis**
Axon can "see" your current tab.
-   **"Look at this screen"**: Instantly captures the visible area and lets you ask questions about charts, images, or designs.
-   **Contextual Help**: Ask "What does this error mean?" or "Summarize this dashboard".

### 📝 **Smart Autofill**
Forget rigid form fillers. Axon understands natural language.
-   **Command**: *"Put my work email in the subscription box"* or *"Fill this application with my dev persona"*.
-   **Logic**: It scans the page, maps your stored profile data to the correct fields, and fills them intelligently.

### 🧠 **Adaptive Memory**
Axon learns as you chat.
-   If you Mention: *"My phone number is 555-0199"*, Axon saves it to your encrypted profile.
-   Next time you ask to fill a form, it remembers.

### 💬 **In-Page Chat (Glass & Gradient)**
A beautiful, non-intrusive chat overlay that floats above your web page.
-   **Premium UI**: Glassmorphism aesthetic with smooth animations.
-   **Control**: Minimize, maximize, or close at any time.

## 🛠️ Installation (Developer Mode)

1.  **Clone this repository**:
    ```bash
    git clone https://github.com/UTTAMGUPTA2712/axon-ai.git
    ```
2.  **Open Chrome Extensions**:
    -   Navigate to `chrome://extensions/`
    -   Toggle **Developer mode** (top right).
3.  **Load Extension**:
    -   Click **Load unpacked**.
    -   Select the folder where you cloned this repo.

## ⚙️ Configuration

1.  Click the **Axon Icon** in your toolbar.
2.  Select **Settings** (Gear Icon).
3.  **AI Provider**: Pick Gemini, Groq, or OpenAI, add your API key, and hit "Fetch Models" to choose which model powers each feature (Chat, Vision, Intent Router, Memory).
    -   *Free keys: [Gemini](https://aistudio.google.com/apikey) · [Groq](https://console.groq.com/keys) · [OpenAI](https://platform.openai.com/api-keys)*
4.  **Profile**: Add your Role, About Me, and any custom Key-Value facts (e.g., Portfolio URL, LinkedIn) to power the Autofill engine.

## ⌨️ Usage

-   **Right-Click Menu**: Quick access to "Axon: Assist" or "Axon: Autofill".
-   **Popup**: Click the icon to launch the Control Panel.
-   **Commands**:
    -   *"Analyze this page"* -> Triggers Vision Agent.
    -   *"Fill formatting form"* -> Triggers Form Agent.
    -   *"Explain this code"* -> Triggers Chat Agent.

## 🏗️ Architecture

-   **Frontend**: Vanilla JS, HTML5, CSS3 (No framework bloat).
-   **Design System**: Custom CSS variables for consistent Glass/Gradient theming (`design.css`).
-   **Backend**: `background.js` acts as an Agent Orchestrator.
    -   **Router**: Classifies intent (Vision vs. Form vs. Chat) using a specialized LLM prompt.
    -   **Agents**: Modular classes (`ChatAgent`, `VisionAgent`, `FormAgent`) handling specific domains.

---

## This repository is the marketing site

Everything above describes the extension, which lives in `ask-ai/`. What is *here*
is the static site: `index.html`, `privacy.html`, `styles.css`, `main.js` and
`cache.js`. There is no build step — open `index.html`.

`main.js` is progressive enhancement over a document that is complete without it:
the docked panel answers a question about the chapter in view, and the sentence it
used is marked. That link is the only motion on the page, by design.

### The one network request

The Plans section reads `GET /plans` from the Axon API so the page states what the
service actually charges rather than a number copied by hand. Everything about it
is written to fail quietly:

- The rows are **in `index.html` already**. A fetch that is blocked, slow or
  unreachable changes nothing on screen.
- The answer is cached by `cache.js` in `localStorage` for **10 minutes**, so a
  reader moving around the page — or coming back the same afternoon — costs one
  request, not one per visit.
- If a refresh fails and a cached answer is on hand, the cached one is shown with
  a line saying so. Past 24 hours it is dropped and the static rows return.
- The request has a 6s deadline of its own.

`cache.js` is the same shape as the server's `CacheService` (`get` / `set` /
`wrap`, one expiry per key) and survives storage being blocked or full by falling
back to memory for the pageview.

**It needs CORS.** The API only answers a browser origin listed in its
`CORS_ORIGINS`, so the site's origin must be in that list
(`https://uttamgupta2712.github.io`, plus whatever you serve from locally). Until
it is, the fetch is blocked and the page shows its static rows — correct, just not
live.

---

*Built with ❤️ for the future of browsing.*
