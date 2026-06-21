const http = require("http");
const fs = require("fs");
const path = require("path");

const port = 8087;
const root = __dirname;
const contentTypes = {
  ".htm": "text/html; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

const server = http.createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, "http://127.0.0.1");
    const pathname = requestUrl.pathname === "/" ? "/login.htm" : requestUrl.pathname;
    const relativePath = decodeURIComponent(pathname).replace(/^\/+/, "");
    const filePath = path.resolve(root, relativePath);
    const relative = path.relative(root, filePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      response.writeHead(403);
      response.end("Acesso negado.");
      return;
    }

    const data = await fs.promises.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(data);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error.code === "ENOENT" ? "Arquivo nao encontrado." : "Erro ao servir arquivo.");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Shadowing local: http://127.0.0.1:${port}/login.htm?return=index.htm`);
});
//uergs2024