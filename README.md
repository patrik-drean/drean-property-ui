# Property Analyzer

A full-stack application for analyzing and managing real estate investment properties.

**Live Demo:** [https://patrik-drean.github.io/drean-property-ui/](https://patrik-drean.github.io/drean-property-ui/)

## Features

- Property management with detailed information tracking
- Automatic property valuation using RentCast API
- Property scoring based on investment criteria
- Zillow integration for property links
- Archivable properties
- Calculator (coming soon)

## Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with:
```
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Backend Setup

1. Navigate to the API directory:
```bash
cd PropertyAnalyzer.Api
```

2. Create a `appsettings.json` file with:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=properties.db"
  },
  "RentcastApiKey": "your_rentcast_api_key",
  "AllowedHosts": "*",
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

3. Run the application:
```bash
dotnet run
```

The API will be available at `http://localhost:5000`.

## Deployment Options

### GitHub Pages Deployment

GitHub Pages is a free and easy way to deploy static websites directly from your GitHub repository.

1. Install GitHub Pages package:
```bash
npm install --save gh-pages
```

2. Make sure your `package.json` has the correct homepage URL and deployment scripts:
```json
"homepage": "https://patrik-drean.github.io/drean-property-ui",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

3. Run the deploy command:
```bash
npm run deploy
```

4. The app will be available at `https://patrik-drean.github.io/drean-property-ui`

By default, the GitHub Pages deployment uses the mock API with sample data, controlled by setting `REACT_APP_USE_MOCK_API=true` in `.env.production`. 

### Other Free Deployment Options

#### Netlify
1. Create an account at [netlify.com](https://www.netlify.com/)
2. Connect your GitHub repository or simply drag and drop your build folder
3. Set environment variables in the Netlify dashboard

#### Vercel
1. Create an account at [vercel.com](https://vercel.com/)
2. Import your GitHub repository 
3. Configure your build settings and environment variables

#### Firebase Hosting
1. Create a Firebase account and project
2. Install Firebase tools: `npm install -g firebase-tools`
3. Initialize and deploy: `firebase init` then `firebase deploy`

## Usage

1. Properties Page:
   - View all properties in a table format
   - Add new properties with the "Add Property" button
   - Properties are automatically scored based on investment criteria
   - Archive properties you're no longer interested in

2. Calculator Page (Coming Soon):
   - Additional investment analysis tools

## Investment Criteria Scoring

Properties are scored on a scale of 1-10 based on:
- Rent to price ratio (1% or higher) - 4 points
- ARV ratio (80% or higher) - 3 points
- Discount (85% or higher) - 2 points
- Rehab costs less than 50K - 1 point
