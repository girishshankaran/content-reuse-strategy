---
topic_id: NET-SSH-TASK-001
title: Configure SSH access
lifecycle:
  introduced_in: "19.0"
  updated_in: ["20.0"]
  deprecated_in: null
  status: active
  replaced_by: null
  applies_to: ["19.9", "20.0"]
retrieval:
  is_canonical: true
  dedupe_key: configure-ssh-access
  allow_in_ai_results: true
---

# Configure SSH access

Use this procedure to enable SSH access on the router.

:::version range="19.9"

## Steps for releases 19.9

1. Open **Configuration > Device Settings**.
2. Enable **SSH Server**.
3. Save the running configuration.

:::

:::version range="20.0+"

## Steps for releases 20.0 and later

1. Open **Configuration > Security > Access**.
2. Turn on **SSH Access**.
3. Apply the policy.

:::

## Verification

Run `show ip ssh` on the device and verify the server is enabled.
