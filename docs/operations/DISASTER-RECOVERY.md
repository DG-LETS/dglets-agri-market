# DG-LETS Disaster Recovery Plan

## Purpose

This document defines the basic recovery procedures for restoring the
DG-LETS application after a major service failure.

## 1. Backend Failure

If the backend becomes unavailable:

1. Check the backend deployment status.
2. Check application/deployment logs.
3. Confirm the latest working GitHub commit.
4. Redeploy the backend.
5. Verify the health endpoint.

```bash
curl -f https://dglets-agri-backend.onrender.com/api/v1/health
