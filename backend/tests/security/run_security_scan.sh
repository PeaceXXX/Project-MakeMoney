#!/bin/bash
# Security Testing Script
# Run various security tests and scans

set -e

echo "========================================="
echo "Security Testing Suite"
echo "========================================="

# Check if we're in the project root
if [ ! -f "backend/requirements.txt" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Create reports directory
mkdir -p reports/security

echo ""
echo "1. Running SQL Injection Tests..."
echo "---------------------------------"
cd backend
python -m pytest tests/security/test_sql_injection.py -v --tb=short || true

echo ""
echo "2. Running XSS Protection Tests..."
echo "---------------------------------"
python -m pytest tests/security/test_xss.py -v --tb=short || true

echo ""
echo "3. Running Authentication Security Tests..."
echo "---------------------------------"
python -m pytest tests/security/test_auth_security.py -v --tb=short || true

echo ""
echo "4. Running API Security Tests..."
echo "---------------------------------"
python -m pytest tests/security/test_api_security.py -v --tb=short || true

echo ""
echo "5. Running Bandit Security Scan..."
echo "---------------------------------"
if command -v bandit &> /dev/null; then
    bandit -r app/ -f json -o ../reports/security/bandit_report.json || true
    bandit -r app/ -f txt || true
else
    echo "Bandit not installed. Installing..."
    pip install bandit
    bandit -r app/ -f json -o ../reports/security/bandit_report.json || true
    bandit -r app/ -f txt || true
fi

echo ""
echo "6. Running Safety Check for Vulnerable Dependencies..."
echo "---------------------------------"
if command -v safety &> /dev/null; then
    safety check -r requirements.txt --json > ../reports/security/safety_report.json || true
    safety check -r requirements.txt || true
else
    echo "Safety not installed. Installing..."
    pip install safety
    safety check -r requirements.txt --json > ../reports/security/safety_report.json || true
    safety check -r requirements.txt || true
fi

echo ""
echo "7. Checking for Hardcoded Secrets..."
echo "---------------------------------"
if command -v detect-secrets &> /dev/null; then
    detect-secrets scan --all-files > ../reports/security/secrets_baseline.json || true
    echo "Secret scan complete. Check reports/security/secrets_baseline.json"
else
    echo "detect-secrets not installed. Skipping secret scan."
    echo "To install: pip install detect-secrets"
fi

cd ..

echo ""
echo "8. Running Frontend Security Audit..."
echo "---------------------------------"
cd frontend
if [ -f "package.json" ]; then
    npm audit --json > ../reports/security/npm_audit.json || true
    npm audit || true
else
    echo "Frontend package.json not found"
fi
cd ..

echo ""
echo "========================================="
echo "Security Testing Complete!"
echo "Reports saved to: reports/security/"
echo "========================================="
echo ""
echo "Summary of tests:"
echo "- SQL Injection: tests/security/test_sql_injection.py"
echo "- XSS Protection: tests/security/test_xss.py"
echo "- Auth Security: tests/security/test_auth_security.py"
echo "- API Security: tests/security/test_api_security.py"
echo "- Bandit Scan: reports/security/bandit_report.json"
echo "- Dependency Check: reports/security/safety_report.json"
echo "- NPM Audit: reports/security/npm_audit.json"
