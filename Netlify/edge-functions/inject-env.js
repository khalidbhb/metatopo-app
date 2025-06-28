export default async (request, context) => {
    const url = new URL(request.url);
    
    // Only process HTML requests
    if (!url.pathname.endsWith('/') && !url.pathname.endsWith('.html')) {
      return;
    }
  
    // Get the response from the origin
    const response = await context.next();
    
    // Only process HTML responses
    if (!response.headers.get('content-type')?.includes('text/html')) {
      return response;
    }
  
    // Get environment variables
    const repoOwner = Deno.env.get('REPO_OWNER') || 'khalidbhb';
    const repoName = Deno.env.get('REPO_NAME') || 'metatopo-data';
    const apiToken = Deno.env.get('API_TOKEN');
  
    console.log('Environment check:', { repoOwner, repoName, hasToken: !!apiToken });
  
    // If no API token is configured, show error
    if (!apiToken) {
      const errorHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Configuration Error - METATOPO</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              background: #dc3545; 
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
              max-width: 600px; 
              background: rgba(0,0,0,0.3); 
              padding: 40px; 
              border-radius: 15px; 
            }
            h1 { margin-bottom: 20px; }
            .error-code { font-family: monospace; background: rgba(0,0,0,0.5); padding: 15px; border-radius: 5px; margin: 20px 0; }
            .steps { text-align: left; margin: 20px 0; }
            .steps li { margin: 10px 0; }
            a { color: #ffc107; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔧 Configuration Netlify Requise</h1>
            <p>La variable API_TOKEN n'est pas configurée.</p>
            
            <div class="error-code">
              Variables détectées :<br>
              • REPO_OWNER: ${repoOwner}<br>
              • REPO_NAME: ${repoName}<br>
              • API_TOKEN: MANQUANT ❌
            </div>
            
            <h3>📋 Étapes de configuration :</h3>
            <ol class="steps">
              <li>Aller dans <strong>Netlify Dashboard</strong></li>
              <li>Sélectionner votre site <strong>METATOPO</strong></li>
              <li>Aller dans <strong>Site Settings → Environment Variables</strong></li>
              <li>Ajouter la variable :
                <ul>
                  <li><code>API_TOKEN</code> = ghp_votre_token_github</li>
                </ul>
              </li>
              <li>Redéployer le site</li>
            </ol>
            
            <p><strong>Support :</strong> <a href="mailto:bouhabba.igt@gmail.com">bouhabba.igt@gmail.com</a> | +212 661 245 376</p>
            <button onclick="location.reload()" style="padding: 10px 20px; background: #ffc107; color: #333; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">🔄 Recharger</button>
          </div>
        </body>
        </html>
      `;
      
      return new Response(errorHTML, {
        status: 200,
        headers: {
          'content-type': 'text/html',
        },
      });
    }
  
    // Read the HTML content
    let html = await response.text();
  
    // Inject environment variables into the HTML at the very beginning of head
    const envScript = `
  <script>
    // Environment variables injected by Netlify Edge Function
    window.REPO_OWNER = '${repoOwner}';
    window.REPO_NAME = '${repoName}';
    window.API_TOKEN = '${apiToken}';
    console.log('Environment variables injected:', {
      REPO_OWNER: window.REPO_OWNER,
      REPO_NAME: window.REPO_NAME,
      hasToken: !!window.API_TOKEN
    });
  </script>`;
  
    // Insert the script right after <head> tag
    html = html.replace('<head>', `<head>${envScript}`);
  
    // Return the modified HTML
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...response.headers,
        'cache-control': 'no-cache, no-store, must-revalidate'
      },
    });
  };