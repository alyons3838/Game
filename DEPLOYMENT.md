# Deployment Guide for The Long Road Home

This game can be deployed to multiple platforms. Here are your options:

## 🚀 Quick Deploy Options

### Option 1: GitHub Pages (Recommended - Simple)

GitHub Pages is the easiest deployment option for this repository.

**Setup Steps:**

1. Go to your GitHub repository: https://github.com/alyons3838/Game
2. Navigate to **Settings** → **Pages**
3. Under "Build and deployment":
   - **Source:** Select **Deploy from a branch**
   - **Branch:** Select `main` (or your default branch) and `/ (root)` folder
   - Click **Save**
4. GitHub will automatically deploy your site
5. Your game will be available at: `https://alyons3838.github.io/Game/`
6. Wait 1-2 minutes for initial deployment

**Optional: GitHub Actions Auto-Deploy**

For automatic deployments on every push, you can set up GitHub Actions:

1. In your repository, navigate to **Settings** → **Pages**
2. Under "Build and deployment", change Source to **GitHub Actions**
3. Create `.github/workflows/deploy.yml` with the workflow template in `deployment-templates/github-pages-workflow.yml`
4. Commit and push - future updates will auto-deploy

**Note:** A GitHub Actions workflow template is provided in `deployment-templates/` but requires manual setup due to workflow permissions.

### Option 2: Cloudflare Pages (High Performance)

Cloudflare Pages offers excellent performance with global CDN and zero cold starts.

**One-time Setup:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** → **Create a project**
3. Connect your GitHub repository: `alyons3838/Game`
4. Configure build settings:
   - **Build command:** Leave empty (no build needed)
   - **Build output directory:** `/`
   - **Root directory:** `/`
5. Click **Save and Deploy**

**Future Deployments:**
- Automatic: Every push to `main` branch triggers a deploy
- Manual: Push to repository or use Cloudflare dashboard

**CLI Deployment (if you have API token):**
```bash
# Set your Cloudflare API token
export CLOUDFLARE_API_TOKEN=your_token_here

# Deploy
wrangler pages deploy . --project-name=the-long-road-home --branch=main
```

### Option 3: Vercel (Zero Config)

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts
4. Your game will be live on a Vercel URL

**Or via Vercel Dashboard:**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Deploy (zero configuration needed)

### Option 4: Netlify (Drag & Drop)

**Quick Deploy:**
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the entire project folder
3. Done! Your game is live

**Or via Git:**
1. Connect your GitHub repository
2. Set build settings:
   - Build command: (leave empty)
   - Publish directory: `/`
3. Deploy

## 🌐 Local Testing

Before deploying, test locally:

```bash
# Install dependencies
npm install

# Start local server
npm start

# Or use Python
python -m http.server 8080
```

Open `http://localhost:8080` in your browser.

## 📝 Deployment Checklist

- [ ] Test the game locally
- [ ] Ensure all dependencies are in package.json
- [ ] Verify manifest.json for PWA settings
- [ ] Test on mobile devices (responsive design)
- [ ] Check service worker (sw.js) is working
- [ ] Verify all assets load correctly
- [ ] Test offline functionality (PWA)

## 🔧 Environment Variables (Optional)

If you want to use AI features with OpenAI:

### GitHub Pages / Netlify / Vercel:
These platforms don't support environment variables for static sites. Users will enter their API key directly in the game settings.

### Cloudflare Pages:
1. Go to your Pages project
2. Settings → Environment variables
3. Add: `OPENAI_API_KEY` (if you want server-side AI)

**Note:** Current implementation uses client-side API keys entered by users, so no server-side env vars needed.

## 🌍 Custom Domain (Optional)

### GitHub Pages:
1. Settings → Pages → Custom domain
2. Add your domain (e.g., `game.yourdomain.com`)
3. Update DNS with CNAME record

### Cloudflare Pages / Vercel / Netlify:
1. Project settings → Domains
2. Add custom domain
3. Follow DNS setup instructions

## 📱 PWA Installation

After deployment, users can install the game as an app:

**iOS:**
1. Open game in Safari
2. Tap Share button
3. "Add to Home Screen"

**Android:**
1. Open game in Chrome
2. Tap menu (⋮)
3. "Add to Home screen" or "Install app"

**Desktop (Chrome/Edge):**
1. Click install icon in address bar
2. Or go to menu → "Install The Long Road Home"

## 🐛 Troubleshooting

**Game doesn't load:**
- Check browser console for errors
- Verify all files are uploaded
- Ensure file permissions are correct
- Test in incognito mode (to rule out cache issues)

**PWA not working:**
- Verify site is served over HTTPS
- Check service worker is registered (DevTools → Application → Service Workers)
- Ensure manifest.json is accessible
- Check manifest.json syntax

**Assets not loading:**
- Verify paths are relative (not absolute)
- Check CORS settings if using external assets
- Test with browser DevTools network tab

**Performance issues:**
- Enable CDN (automatic with Cloudflare/Vercel/Netlify)
- Compress assets
- Check service worker caching strategy

## 📊 Deployment Comparison

| Platform | Setup Time | Performance | Free Tier | Auto Deploy | Custom Domain |
|----------|-----------|-------------|-----------|-------------|---------------|
| GitHub Pages | 5 min | Good | Yes | Yes | Yes |
| Cloudflare Pages | 10 min | Excellent | Yes | Yes | Yes |
| Vercel | 5 min | Excellent | Yes | Yes | Yes |
| Netlify | 5 min | Excellent | Yes | Yes | Yes |

## ✅ Recommended: GitHub Pages

For this project, **GitHub Pages with GitHub Actions** is recommended because:
- ✅ Zero configuration needed (already set up)
- ✅ Free hosting
- ✅ Automatic deployments
- ✅ Custom domain support
- ✅ HTTPS by default
- ✅ Good performance with CDN
- ✅ No API keys or signup needed

## 🎮 Post-Deployment

After successful deployment:
1. Test the game on the live URL
2. Share the URL with players
3. Monitor any issues via browser DevTools
4. Update the README.md with your live URL
5. Consider adding analytics (optional)

---

**Need help?** Open an issue on GitHub or check the main README.md for more information.
