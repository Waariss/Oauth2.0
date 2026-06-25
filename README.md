# Detecting Vulnerable OAuth 2.0 Implementations in Android Applications

**Presented at the Workshop on Cyber Forensics, Security, and E-discovery, as part of the 23rd IEEE International Conference on Software Quality, Reliability, and Security, 2023.**

This project studies real-world OAuth 2.0 implementations and focuses on how state handling impacts resilience against cross-site request forgery (CSRF). It combines research artifacts and practical tooling for both Android and Web environments.

Our primary objective is to help identify weak OAuth flows by inspecting whether critical callback signals—especially `state` and authorization `code`—are present and coherent across the authentication lifecycle.

## Project Scope

### Android Track
We developed Android-based tooling to evaluate OAuth 2.0 login behavior across browser contexts (Chrome and default browser), with emphasis on detecting missing or inconsistent parameters related to CSRF defense.

### Web Track
We developed a browser extension and companion web applications to inspect OAuth redirect behavior and assess whether implementations demonstrate basic CSRF protection characteristics.

## Highlights (2026)

### OAuth 2.0 Flow Inspector Extension (`extension/`)
- Upgraded to **v2.0.0**
- Correlates authorization request and callback events
- Produces CSRF-oriented verdicts:
  `basic-protected`, `potential-csrf`, `state-mismatch`, `high-risk`, `manual-review`
- Includes improved popup diagnostics and clearer finding summaries

### Authentication Web State (`Web_App/Authentication_Web_State/client`)
- Upgraded flow quality with **PKCE** support
- Added explicit callback diagnostics for `state` and `code`
- Integrated server-side token exchange endpoint
- Improved UI for security-testing workflows

## Core Deliverables

- Research-backed Android testing workflows for OAuth 2.0 behavior analysis
- Web OAuth testing applications for state/code validation scenarios
- OAuth 2.0 Flow Inspector (Extension v2.0.0) for request-callback correlation and verdict-based assessment
- Publication and conference artifacts supporting methodology and findings

## References

- [Extension Guide](https://github.com/Waariss/Oauth2.0/blob/main/extension/HOW_TO_USE.md)
- [Conference Paper](https://ieeexplore.ieee.org/document/10430018)
- [Cybersecurity Laboratory Blog](https://cysec.ise.ritsumei.ac.jp/2023/11/02/from-thailand-to-japan-my-cybersecurity-internship-at-ritsumeikan-university/)

---
