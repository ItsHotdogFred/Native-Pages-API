# Native Pages API

a small server that lets you search through a collection of pages using natural language instead of exact keywords. it generates vector embeddings for each page on startup, then compares your search query against all of them using cosine similarity to find the best match.

built with bun, powered by openrouter's embedding model, and uses the `ai` package for the similarity math.

## how it works

when the server starts, it scans the `pages/` directory for json files. for each one, it checks if an embedding already exists in `converted/`. if not, it sends the filename plus file contents to openrouter's text embedding endpoint and writes the resulting vector to disk as a plain text file.

the search endpoint takes a query, embeds it the same way, then walks through every stored vector and ranks them by cosine similarity. the view endpoint just serves a page by name.

## endpoints

**POST /api/search**

send a json body with a `search` field. returns a ranked list of pages with their similarity scores.

```json
{ "search": "a cozy place by the fire" }
```

**GET /api/view?page=name**

returns the raw json for a page. pass the page name without the extension.

## getting started

you need bun installed, and an openrouter api key.

1. copy `.env.example` to `.env` and add your `OPENROUTER_KEY`
2. install dependencies:

```bash
bun install
```

3. run it:

```bash
bun run dev
```

that starts the server on port 3000. the first run will generate embeddings for all pages, which takes a bit depending on how many you have. subsequent runs skip pages that already have embeddings stored.

## pages

the `pages/` folder contains json files that describe screens using a component system (boxes, text, ascii art, spacers, etc.). you can add more pages by dropping new json files in there. next time the server starts, it will embed anything it has not seen before.

the `converted/` folder is auto generated. you can delete it to force re embedding everything.
