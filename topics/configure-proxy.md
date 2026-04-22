---
topic_id: NET-PROXY-TASK-001
title: Configure proxy on a router
lifecycle:
  introduced_in: "20.0"
  updated_in: []
  deprecated_in: null
  status: active
  replaced_by: null
  applies_to: ["20.0"]
retrieval:
  is_canonical: true
  dedupe_key: configure-router-proxy
  allow_in_ai_results: true
---

# Configure proxy on a router

Use this procedure to configure a proxy server for router traffic in release 20.0.

## Steps

1. Open **Configuration > Network Services > Proxy**.
2. Enable **Use Proxy Server**.
3. Enter the proxy host name or IP address.
4. Enter the proxy port.
5. If authentication is required, enter the user name and password.
6. Save and deploy the configuration.

## Verification

Confirm that the proxy settings are shown in the router network services summary.
