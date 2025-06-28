export default async (request, context) => {
  const url = new URL(request.url);
  
  // Only process HTML requests
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.json')) {
    return;
  }

  // Get the response from the origin
  const response = await context.next();
  
  // Only process HTML responses
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  // Get environment variables with fallbacks
  const repoOwner = Deno.env.get('REPO_OWNER') || Deno.env.get('GITHUB_OWNER') || 'khalidbhb';
  const repoName = Deno.env.get('REPO_NAME') || Deno.env.get('GITHUB_REPO') || 'metatopo-data';
  const apiToken = Deno.env.get('API_TOKEN') || Deno.env.get('GITHUB_TOKEN');

  // Log for debugging (visible in Netlify function logs)
  console.log('Edge Function - Environment Check:', {
    hasToken: !!apiToken,
    repoOwner,
    repoName,
    path: url.pathname
  });

  // Read the HTML content
  let html = await response.text();

  if (!apiToken) {
    // Show configuration error page
    const errorHTML = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <title>Configuration METATOPO</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            color: white; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            min-height: 100vh; 
            margin: 0; 
            text-align: center; 
            padding: 20px; 
          }
          .container { 
            max-width: 700px; 
            background: rgba(0,0,0,0.3); 
            padding: 40px; 
            border-radius: 20px; 
            backdrop-filter: blur(10px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
          }
          h1 { margin-bottom: 20px; font-size: 2.5rem; }
          .error-code { 
            font-family: 'Courier New', monospace; 
            background: rgba(0,0,0,0.5); 
            padding: 20px; 
            border-radius: 10px; 
            margin: 20px 0; 
            text-align: left;
            border-left: 4px solid #ffc107;
          }
          .steps { text-align: left; margin: 20px 0; }
          .steps li { margin: 15px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; }
          a { color: #ffc107; text-decoration: none; }
          a:hover { color: #fff; }
          .btn { 
            padding: 15px 30px; 
            background: #ffc107; 
            color: #333; 
            border: none; 
            border-radius: 10px; 
            cursor: pointer; 
            margin: 10px; 
            font-weight: bold;
            font-size: 16px;
          }
          .btn:hover { background: #ffcd39; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔧 Configuration Netlify</h1>
          <p style="font-size: 1.2rem;">Variables d'environnement manquantes</p>
          
          <div class="error-code">
            Variables détectées :<br><br>
            • REPO_OWNER: <strong>${repoOwner}</strong><br>
            • REPO_NAME: <strong>${repoName}</strong><br>
            • API_TOKEN: <strong style="color: #ff6b6b;">❌ MANQUANT</strong>
          </div>
          
          <h3>📋 Configuration requise :</h3>
          <ol class="steps">
            <li><strong>Netlify Dashboard</strong> → Votre site METATOPO</li>
            <li><strong>Site Settings</strong> → <strong>Environment Variables</strong></li>
            <li>Ajouter: <code>API_TOKEN</code> = <code>ghp_votre_token</code></li>
            <li><strong>Deploy settings</strong> → <strong>Trigger deploy</strong></li>
          </ol>
          
          <div style="margin-top: 30px;">
            <button onclick="location.reload()" class="btn">🔄 Recharger</button>
            <a href="https://docs.netlify.com/environment-variables/overview/" target="_blank" class="btn" style="display: inline-block; text-decoration: none;">📖 Documentation</a>
          </div>
          
          <p style="margin-top: 30px; font-size: 0.9rem;">
            <strong>Support:</strong> 
            <a href="mailto:bouhabba.igt@gmail.com">bouhabba.igt@gmail.com</a> | 
            <a href="tel:+212661245376">+212 661 245 376</a>
          </p>
        </div>
      </body>
      </html>
    `;
    
    return new Response(errorHTML, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  }

  // Inject environment variables into HTML
  const envScript = `
<script>
// 🔧 Environment variables injected by Netlify Edge Function
window.REPO_OWNER = '${repoOwner}';
window.REPO_NAME = '${repoName}';
window.API_TOKEN = '${apiToken}';

// Debug info
console.log('✅ Environment variables loaded:', {
  REPO_OWNER: window.REPO_OWNER,
  REPO_NAME: window.REPO_NAME,
  hasToken: !!window.API_TOKEN,
  tokenLength: window.API_TOKEN?.length || 0
});

// Validate token format
if (window.API_TOKEN && !window.API_TOKEN.startsWith('ghp_')) {
  console.warn('⚠️ API_TOKEN should start with "ghp_"');
}
</script>`;

  // Insert script right after <head> tag
  html = html.replace(/<head(\s[^>]*)?>/i, `<head$1>${envScript}`);

  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers),
      'cache-control': 'no-cache, no-store, must-revalidate',
      'pragma': 'no-cache',
      'expires': '0'
    },
  });
};
