import { OpenRouter } from '@openrouter/sdk';
import { Glob } from "bun";
import { cosineSimilarity } from 'ai';

const openRouter = new OpenRouter({
  apiKey: process.env.OPENROUTER_KEY,
});

if (!process.env.OPENROUTER_KEY) {
  throw new Error('Missing OPENROUTER_KEY environment variable');
}

const glob = new Glob("*");
// scanSync returns an iterator of file paths
for (const file of glob.scanSync("./pages")) {
    const split = file.split(".")
    // console.log(split);
  
  const convertedFile = Bun.file("./converted/" + split[0] + ".txt")
  if (!(await convertedFile.exists())) {
    console.log(split[0] + ".txt does not exist yet")
    const response = await openRouter.embeddings.generate({
    requestBody: {
        model: 'openai/text-embedding-3-small',
        input: split[0] + Bun.file("./pages/" + file),
    },
    });

    Bun.write("./converted/" + split[0] + ".txt", JSON.stringify(response.data[0].embedding))

  } else {
    console.log(split[0] + ".txt does exist")
  }
}


const port = 3000

const server = Bun.serve({
    port: port,
    async fetch(request) {
    const url = new URL(request.url)

    if (url.pathname === "/api/search" && request.method === "POST") {
        
        const body = await request.json();
        const response = await openRouter.embeddings.generate({
        requestBody: {
            model: 'openai/text-embedding-3-small',
            input: body.search,
        }
        });

        const matches = []
        for (const file of glob.scanSync("./converted")) {
          const storedVector = JSON.parse(await Bun.file("./converted/" + file).text())
          const similarity = cosineSimilarity(response.data[0].embedding, storedVector)
          matches.push({ file, similarity })
        }
        matches.sort((a, b) => b.similarity - a.similarity)
        for (const match of matches) {
          console.log(`Closeness: ${match.similarity}, file: ` + match.file)
        }

        return new Response(JSON.stringify(matches), {
            headers: { 'Content-Type': 'application/json' }
        });
        // return new Response(Bun.file("./pages/" + matches[0].file.replace(/\.txt$/, ".json")));
    } else if (url.pathname == "/api/view/" && request.method === "GET") {

      const file = url.searchParams.get('page') + ".json";

      return new Response(Bun.file("./pages/" + file));
    }

    return new Response("Not Found", { status: 404});
}
});

console.log(`Listening on http://localhost:${port} - Server: ${server.hostname}:${server.port}`)
