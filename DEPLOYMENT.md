# Deployment Instructions

This document provides instructions for deploying the PropGuide AI UI to various hosting platforms.

## GitHub Pages Deployment

GitHub Pages is a free and easy way to deploy static websites directly from your GitHub repository.

### Prerequisites

1. Create a GitHub repository for your project
2. Push your code to the repository

### Deployment Steps

1. Update the `homepage` field in `package.json` with your GitHub username:
   ```json
   "homepage": "https://yourusername.github.io/drean-property-ui",
   ```

2. Run the deploy command:
   ```bash
   npm run deploy
   ```

3. The app will be built and deployed to the `gh-pages` branch of your repository
4. Visit `https://yourusername.github.io/drean-property-ui` to see your deployed app

### Configuration

By default, the GitHub Pages deployment uses the mock API to provide demo data without requiring a backend server. This is controlled by:

```
REACT_APP_USE_MOCK_API=true
```

in the `.env.production` file.

If you want to use a real backend API with the GitHub Pages deployment:

1. Deploy your backend API to a hosting service (e.g., Azure, AWS, Heroku)
2. Update the `.env.production` file:
   ```
   REACT_APP_API_BASE_URL=https://your-real-api-url.com
   REACT_APP_USE_MOCK_API=false
   ```

3. Redeploy with `npm run deploy`

## Netlify Deployment

Netlify provides a very easy way to deploy static sites with a generous free tier.

1. Create an account at [netlify.com](https://www.netlify.com/)

2. Install the Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

3. Build your project:
   ```bash
   npm run build
   ```

4. Deploy to Netlify:
   ```bash
   netlify deploy
   ```

5. Follow the prompts to complete the deployment
   - Choose "Create & configure a new site"
   - Select your team
   - Enter a site name (or leave blank for a random name)
   - Specify the publish directory as `build`

6. To deploy to production:
   ```bash
   netlify deploy --prod
   ```

## Vercel Deployment

Vercel is another excellent platform for deploying static sites.

1. Create an account at [vercel.com](https://vercel.com/)

2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

3. Deploy to Vercel:
   ```bash
   vercel
   ```

4. Follow the prompts to complete the deployment

## Firebase Hosting

Firebase Hosting is another free option for static sites.

1. Create a Firebase account and project at [firebase.google.com](https://firebase.google.com/)

2. Install the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

3. Login to Firebase:
   ```bash
   firebase login
   ```

4. Initialize Firebase in your project:
   ```bash
   firebase init
   ```
   - Select "Hosting"
   - Choose your Firebase project
   - Set the public directory to `build`
   - Configure as a single-page app? "Yes"
   - Set up automatic builds? "No"

5. Build your project:
   ```bash
   npm run build
   ```

6. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

## Using Your Own Custom Domain

For any of these hosting services, you can configure a custom domain:

1. Purchase a domain from a domain registrar (GoDaddy, Namecheap, etc.)
2. Follow the hosting service's instructions for adding a custom domain
3. Update DNS settings at your domain registrar to point to your hosting service 