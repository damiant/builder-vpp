# Fusion Metrics API

Source: https://www.builder.io/c/docs/fusion-metrics-api

## Common request format

All documented endpoints use:

- `GET`
- `Content-Type: application/json`
- `Authorization: Bearer YOUR-PRIVATE-TOKEN`
- Required date filters:
  - `startDate=YYYY-MM-DD` inclusive
  - `endDate=YYYY-MM-DD` inclusive

Space-scoped endpoints also require the Space Public API Key in the URL path.

---

## 1) Organization-level user metrics

### Request

```http
GET https://builder.io/api/v1/orgs/fusion/users
```

### Query parameters

- `startDate` required
- `endDate` required

### Example request

```bash
curl -X GET https://builder.io/api/v1/orgs/fusion/users \
  -d startDate=2024-01-01 \
  -d endDate=2024-01-31 \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR-PRIVATE-TOKEN'
```

### Expected success response

```json
{
  "data": [
    {
      "userId": "user123",
      "userEmail": "user@example.com",
      "lastActive": "2024-01-15T14:30:00Z",
      "designExports": 5,
      "metrics": {
        "linesAdded": 1250,
        "linesRemoved": 320,
        "linesAccepted": 980,
        "totalLines": 1570,
        "events": 45,
        "userPrompts": 28,
        "creditsUsed": 12.5,
        "prsMerged": 3,
        "tokens": {
          "total": 125000,
          "input": 45000,
          "output": 80000,
          "cacheWrite": 15000,
          "cacheInput": 5000
        }
      }
    }
  ]
}
```

### Response fields

Per user record:

- `userId` string
- `userEmail` string
- `lastActive` ISO timestamp string
- `designExports` number
- `metrics` object
  - `linesAdded` number
  - `linesRemoved` number
  - `linesAccepted` number
  - `totalLines` number
  - `events` number
  - `userPrompts` number
  - `creditsUsed` number
  - `prsMerged` number
  - `tokens` object
    - `total` number
    - `input` number
    - `output` number
    - `cacheWrite` number
    - `cacheInput` number

---

## 2) Space-level user metrics

### Request

```http
GET https://builder.io/api/v1/spaces/:publicApiKey/fusion/users
```

### Query parameters

- `startDate` required
- `endDate` required

### Example request

```bash
curl -G https://builder.io/api/v1/spaces/:publicApiKey/fusion/users \
  -d startDate=2025-07-01 \
  -d endDate=2025-07-31 \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR-PRIVATE-TOKEN'
```

### Expected success response

```json
{
  "data": [
    {
      "userId": "USER_ID",
      "lastActive": "2025-07-29T21:32:36.650Z",
      "metrics": {
        "linesAdded": 0,
        "linesRemoved": 0,
        "linesAccepted": 0,
        "totalLines": 162829,
        "events": 991,
        "userPrompts": 218,
        "creditsUsed": "210",
        "designExports": 0,
        "tokens": {
          "total": 69489123,
          "input": 2627914,
          "output": 361338,
          "cacheWrite": 15878681,
          "cacheInput": 50621190
        }
      }
    }
  ]
}
```

### Notes

- `userEmail` is not shown in the example payload for this endpoint.
- `creditsUsed` appears as a string in the documented sample.

---

## 3) Organization-level events

### Request

```http
GET https://builder.io/api/v1/orgs/fusion/events
```

### Query parameters

- `startDate` required
- `endDate` required

### Example request

```bash
curl -G https://builder.io/api/v1/orgs/fusion/events \
  -d startDate=2025-07-01 \
  -d endDate=2025-07-31 \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR-PRIVATE-TOKEN'
```

### Expected success response

```json
{
  "data": [
    {
      "eventId": "EVENT_ID",
      "timestamp": "2025-07-29T21:33:57.331Z",
      "feature": "fusion",
      "userId": "USER_ID",
      "userEmail": "USER_EMAIL",
      "spaceId": "SPACE_ID",
      "spaceName": "My Fusion Space",
      "metadata": {
        "tokensUsed": 57842
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 8039,
    "totalPages": 81,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### Response fields

Per event record:

- `eventId` string
- `timestamp` ISO timestamp string
- `feature` string
- `userId` string
- `userEmail` string
- `spaceId` string
- `spaceName` string
- `metadata` object

Pagination object:

- `page` number
- `limit` number
- `total` number
- `totalPages` number
- `hasNext` boolean
- `hasPrevious` boolean

---

## 4) Space-level events

### Request

```http
GET https://builder.io/api/v1/spaces/:publicApiKey/fusion/events
```

### Query parameters

- `startDate` required
- `endDate` required
- `feature` optional, comma-separated list
- `framework` optional
- `userId` optional
- `projectId` optional

### Example request

```bash
curl -G https://builder.io/api/v1/spaces/:publicApiKey/fusion/events \
  -d startDate=2025-07-01 \
  -d endDate=2025-07-31 \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR-PRIVATE-TOKEN'
```

### Expected success response

```json
{
  "data": [
    {
      "eventId": "EVENT_ID",
      "timestamp": "2025-07-29T21:33:57.331Z",
      "feature": "fusion",
      "userId": "USER_ID",
      "userEmail": "USER_EMAIL",
      "spaceId": "SPACE_ID",
      "spaceName": "My Fusion Space",
      "metadata": {
        "tokensUsed": 57842
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 3825,
    "totalPages": 39,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

## 5) Filterable `feature` values

Documented values include:

- `fusion` — code generation and AI-assisted development in Builder
- `editor-ai` — AI editing in the Visual Editor Interact panel
- `cli` — code generation from the Builder CLI
- `builder-code-panel` — code panel interactions in the Visual Editor
- `repo-indexing` — repository indexing for codebase analysis

Agent variants may also appear, such as `fusion-agent` and `editor-ai-agent`.

---

## Design exports

A design export is a single conversion from a design tool into code.

Important notes:

- Counted separately from AI chat events
- Counted once per unique export
- Counted once per reporting period

---

## Expected error responses

The docs list these possible HTTP statuses:

- `400` — invalid date format or missing required parameter
- `404` — organization or space not found, or request not authorized
- `500` — internal server error

No structured JSON error body example was provided.
