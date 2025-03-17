/**
 * Daily Eats Cloudflare Worker
 * This worker serves the static assets from the dist directory
 */

// Define the HTML content type
const htmlContentType = {
  'content-type': 'text/html;charset=UTF-8',
}

// Handle incoming requests
async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname

  try {
    // Serve index.html for the root path
    if (path === '/' || path === '') {
      return new Response(
        `<!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Daily Eats</title>
            <script type="module" src="/main.js"></script>
          </head>
          <body>
            <h1>Daily Eats</h1>
            <div id="app"></div>
          </body>
        </html>`,
        {
          headers: htmlContentType,
        }
      )
    }

    // For other requests, try to serve from the assets
    // In a real implementation, you would use Cloudflare's KV or R2 to store and serve assets
    return new Response(`Resource at ${path} not found`, { status: 404 })
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 })
  }
}

// Register the fetch event handler
addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})
