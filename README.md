
# 💼 L.E.G.E.N.D. — SecureWealth Twin

## 🚀 Project Overview

**L.E.G.E.N.D. (SecureWealth Twin)** is a web-based wealth management prototype that goes beyond traditional finance apps.

It combines:

* 📊 Wealth growth
* 🧠 Financial intelligence
* 🛡️ Fraud-aware protection

👉 The core idea:
**Don’t just manage money — protect every financial action before it happens.**

---

## 🛠️ Tech Stack

### 🎨 Frontend

* `Next.js` 16
* `React` 19
* `TypeScript`
* `Tailwind CSS`
* `Radix UI`
* `Lucide React`
* `Recharts`

---

### ⚙️ Backend

* `Node.js`
* `Express.js`
* `MongoDB`
* `Mongoose`

---

### 🔐 Authentication & Security

* `JWT` (access & refresh tokens)
* `bcrypt / bcryptjs`
* `WebAuthn` (`@simplewebauthn/browser`, `@simplewebauthn/server`)
* OTP-based verification
* Custom session tracking

---

### 🚀 Queues & Infrastructure

* `BullMQ`
* `Redis`

---

### 🤖 AI & Intelligence Layer

* Rule-based + heuristic finance & fraud logic
* Python AI modules (`backend/modules/ai`)
* Optional LLM integrations (`OpenAI`, `Gemini`)
* Market intelligence with fallback mechanisms

---

### 🏗️ Architecture

* API-driven frontend/backend separation
* Modular backend (services, controllers, routes)
* Simulated bank-integration environment (for demo/hackathon use)

---

## ✨ Core Features

### 🔐 Authentication & Trust

* Secure signup/login flow
* Mandatory **PIN + OTP verification**
* New-device detection & trust handling
* Duress/private session trigger (silent protection mode)

### 📊 Dashboard & Overview

* Financial overview (income, savings, investments, net worth)
* Trust posture & risk indicators
* Goals, insights, and recent activity

### 🏦 Banking Simulation

* Dummy bank integration
* Multiple linked accounts
* Internal transfers between accounts
* External transfers with:

  * OTP verification
  * Cyber-risk checks

### 💸 Investments

* Investment opportunities page
* SIP / direct / rebalance-style actions
* Mandatory funding account selection
* OTP-secured transactions

### 🎯 Goals & Planning

* Goal tracking with deadlines
* Progress monitoring
* Predicted completion timelines

### 📈 Portfolio & Simulation

* Portfolio overview & allocation
* Wealth projection simulator
* Future financial forecasting

### 🤖 AI & Intelligence

* AI-style financial insights
* Market-aware recommendations
* Explainable decision logic

### 🧾 Transaction Intelligence

* Fraud/risk insights from transaction history
* Risk scoring and behavioral analysis

### 🛡️ Security & Protection

* Trust score & security posture
* Risk-based action outcomes:

  * ✅ Allow
  * ⚠️ Warn
  * ⛔ Block
  * ⏳ Delay

### 👥 Recovery & Assistance

* Trusted contacts management
* Chat assistant for finance guidance & navigation

### 📜 Audit & Logging

* Audit logs for sensitive actions
* Risk logs with explainable summaries

---

## 🔒 Security & Fraud Protection

* Device-based session tracking
* Trusted vs untrusted device detection
* PIN + OTP verification
* Transaction-level OTP
* Session inactivity timeout

### 🚨 Detection Signals

* Unusual transaction amounts
* First-time actions
* Rapid behavior patterns
* Suspicious activity detection

### 🕵️ Special Feature

* **Duress Mode** → silent protection + fake dashboard

---

## 🧠 Wealth Intelligence Features

* Financial health scoring
* Savings-rate tracking
* Goal-based planning
* Portfolio guidance
* Risk-aware investment suggestions
* Explainable AI recommendations

---

## 🎨 Product & UX

* Modular multi-page app:

  * Dashboard
  * SecureWealth Twin
  * Simulator
  * Transaction Intelligence
  * Banks
  * Portfolio
  * Invest
  * Goals
  * Security
  * Contacts
  * Insights

* Modern dashboard UI

* Guided verification flows

* Protected action dialogs

* User explanations for blocked/delayed actions

* Fake safe-mode UI in duress scenarios

---

## 🌟 USP (What Makes It Stand Out)

* Combines **wealth creation + fraud protection**
* Introduces **SecureWealth Twin** concept
* Mandatory protection layer before financial actions
* Focus on **wealth fraud (not just payments)**
* Explainable decisions → builds trust
* End-to-end simulation (banking + investments + security)

### 💡 Unique Highlights

* Duress/private-session safety mode
* AI + cybersecurity integration
* Context-aware assistant
* Feels like a **bank-ready product demo**

---

## 💪 Major Strengths

* Strong hackathon alignment
* Wide feature coverage
* High demo value (interactive flows)
* Clear fraud-protection narrative
* Modular & scalable architecture
* Enhanced login security (PIN + OTP)

---

## ⚠️ Limitations

### 🔧 Technical

* No real bank integrations (uses dummy datasets)
* No Account Aggregator integration
* Some frontend issues (e.g., `chart.tsx`) 
* Prototype-level security (not enterprise-grade)
* No full production deployment setup

### 🤖 Intelligence

* Some AI logic is rule-based
* Market data fallback if APIs fail
* Limited personalization depth

### 📊 Data

* Relies on mock/seeded data
* Fraud detection partly simulated

### 🏢 Enterprise Gaps

* No full KYC workflow
* No consent ledger
* No encryption-at-rest proof
* Limited SME/corporate support

---

## 🧪 Functional Constraints

* Limited without live APIs
* Simulated device telemetry
* Build issues due to unrelated frontend bugs
* Some modules are conceptual

---

## ⚡ One-Line Tech Stack

> **Next.js + React + Node.js + MongoDB with AI-driven fraud detection, WebAuthn security, and Redis-backed async processing**

---

## 🧾 One-Line Description

> **A fraud-aware digital wealth management twin that helps users plan, invest, and act while enforcing risk checks before sensitive financial actions.**

---

## 🔮 Future Improvements

* Real bank API integrations
* Full compliance & KYC flows
* Production-grade security
* Advanced ML-based fraud detection
* Better AI personalization
* Full deployment & observability

