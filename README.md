# Detecting Vulnerable OAuth 2.0 Implementations in Android Applications

**Presented at the Workshop on Cyber Forensics, Security, and E-discovery, as part of the 23rd IEEE International Conference on Software Quality, Reliability, and Security, 2023.**

OAuth 2.0, a widely used authorization framework, can potentially be vulnerable to cross-site request forgery (CSRF) attacks. While the introduction of a state parameter in the URL during the login process acts as a key countermeasure, the mere absence of this parameter doesn't automatically signify a vulnerability to CSRF attacks.

In our pursuit to understand the nuances of this issue, we crafted tools for analyzing both Android and web applications. Our primary focus was on those using OAuth 2.0 with Google accounts, emphasizing the role of the state parameter in countering CSRF attacks.

For Android applications, we developed an Android application dedicated to analyzing other apps. Our assessment extended to the login procedures of these applications through both the Chrome application and the default browser. The intent was to discern the presence (or lack) of both the state parameter and the authorization code, vital elements in CSRF attack prevention.

For web applications, we developed a browser extension to examine the presence of critical security components like the state parameter and authorization code. This research emphasizes the importance of diligent implementation and robust security measures for developers using OAuth 2.0. By using this extension, we demonstrated the potential for auditing existing web applications for security vulnerabilities.

Our overarching goal is to determine whether applications employing OAuth 2.0 are adequately safeguarded against CSRF attacks, irrespective of the platform. The insights derived from this research can play a pivotal role in enhancing user protection by pinpointing and cautioning against applications that, despite using OAuth 2.0 for social logins, are susceptible to CSRF attacks.

## Repository Contents

### Mobile App:
- App
- Check App
- ninka
- ninka_old
- Chrome

### Authentication:
- Mobile:
  - Both
  - Nonce
  - Only_auth_code
  - mobile_code_chrome
  - mobile_state_chrome
- Web:
  - Web_Nonce
  - Web_Only_auth_code
  - Web_State

### Authorization:
- Mobile:
  - Both
  - nonce
  - only_auth_code
  - mobile_Code_Chrome
  - mobile_State_Chrome
- Web:
  - Web_Auth_code
  - Web_Nonce
  - Web_State

### Additional Resources:
- Extension
- [Ritsumeikan University Poster](https://waariss.github.io/Poster_Cyber_Lab/)
- [Cybersecurity Laboratory Blog](https://cysec.ise.ritsumei.ac.jp/2023/11/02/from-thailand-to-japan-my-cybersecurity-internship-at-ritsumeikan-university/)

---
