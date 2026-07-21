# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

1. **Do NOT open a public GitHub issue**
2. Email security report to: security@example.com
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix if any

## Response Timeline

- Acknowledgment within 48 hours
- Initial assessment within 1 week
- Fix and release as soon as possible for critical issues
- Credit in CHANGELOG and security advisory (unless you prefer anonymity)

## Security Considerations

This engine:

- Parses untrusted HTML/JSON from AliExpress
- Uses `new Function` only as final fallback in SafeJsonParser with strict mode - sandboxed
- Does not execute arbitrary script from pages
- No credential storage
- Safe for server-side use

If you run as Apify Actor, ensure proxy configuration to avoid IP bans, but no credential leakage.

## Dependencies

We use `npm audit` and Dependabot. Critical vulnerabilities in dependencies are patched promptly.

Thank you for helping keep this project secure!
