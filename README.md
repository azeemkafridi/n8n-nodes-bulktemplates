# n8n-nodes-bulktemplates

An n8n community node for [BulkTemplates](https://bulktemplates.com) — render branded images from templates directly in your n8n workflows.

## Features

- **Template**: List and fetch template definitions
- **Render**: Generate a PNG image from a template (by ID or inline JSON)
- **Batch**: Submit a CSV for bulk rendering, poll job status, and download results

## Installation

### Via n8n UI

1. Open n8n → **Settings** → **Community Nodes**
2. Click **Install a community node**
3. Enter `n8n-nodes-bulktemplates`
4. Click **Install**

### Via CLI

```bash
npm install n8n-nodes-bulktemplates
```

## Credentials

1. Log in to [bulktemplates.com](https://bulktemplates.com)
2. Go to **Editor → Settings → API Keys**
3. Click **Create API Key** and copy the key (starts with `bk_`)
4. In n8n, add a new **BulkTemplates API** credential and paste the key

## Operations

### Template

| Operation | Description |
|-----------|-------------|
| List | Return a lightweight summary of all available templates |
| Get | Fetch the full definition of a single template by ID |

### Render

| Operation | Description |
|-----------|-------------|
| Render by Template ID | Render a PNG from a saved template + field data |
| Render Inline | Render a PNG from a full inline template JSON + field data |

Both render operations return the PNG as an **n8n binary item** — pipe it into a *Write Binary File*, *Send Email*, or *HTTP Request* node.

**Field Data** is a JSON object mapping template field keys to values:
```json
{ "heading": "Hello World", "imageUrl": "https://example.com/photo.jpg" }
```

### Batch

| Operation | Description |
|-----------|-------------|
| Submit | Upload a CSV and template ID to start an async bulk render job |
| Status | Poll a job for progress (`status`, `total`, `done`, `files`) |
| Download File | Download a single rendered PNG from a completed job |

**CSV format** — first row must be headers matching template field keys:
```
heading,caption,imageUrl
"Title 1","Subtitle 1","https://..."
"Title 2","Subtitle 2","https://..."
```

**Batch polling pattern** — use n8n's built-in *Wait* node in a loop:
1. **Batch → Submit** → get `id`
2. **Wait** (e.g. 10 seconds)
3. **Batch → Status** → check `status`
4. **IF** `status !== "done"` → go back to step 2
5. **Batch → Download File** for each entry in `files`

## Built-in Templates

These template IDs are ready to use without creating your own:

- `yellow-square`
- `story-9-16`
- `quote-card`
- `announcement`
- `breaking-news-red`
- `editorial-minimal`
- `dark-markets`
- `pull-quote`
- `split-card`

## Links

- [BulkTemplates](https://bulktemplates.com)
- [npm](https://www.npmjs.com/package/n8n-nodes-bulktemplates)
- [GitHub](https://github.com/azeemkafridi/n8n-nodes-bulktemplates)

## License

MIT
