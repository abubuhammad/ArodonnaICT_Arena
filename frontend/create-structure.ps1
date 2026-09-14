# Create the main folders
New-Item -Path "src" -ItemType Directory -Force
New-Item -Path "src/assets" -ItemType Directory -Force
New-Item -Path "src/components" -ItemType Directory -Force
New-Item -Path "src/hooks" -ItemType Directory -Force
New-Item -Path "src/pages" -ItemType Directory -Force
New-Item -Path "src/services" -ItemType Directory -Force
New-Item -Path "src/store" -ItemType Directory -Force
New-Item -Path "src/styles" -ItemType Directory -Force

# Create the main files
New-Item -Path "src/App.tsx" -ItemType File -Force
New-Item -Path "src/index.tsx" -ItemType File -Force
New-Item -Path "src/routes.tsx" -ItemType File -Force

# Add some basic content to the files
$appContent = @"
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Routes from './routes';

function App() {
  return (
    <Router>
      <Routes />
    </Router>
  );
}

export default App;
"@

$indexContent = @"
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
"@

$routesContent = @"
import React from 'react';
import { Routes as RouterRoutes, Route } from 'react-router-dom';

const Routes = () => {
  return (
    <RouterRoutes>
      {/* Add your routes here */}
      <Route path="/" element={<div>Home Page</div>} />
    </RouterRoutes>
  );
};

export default Routes;
"@

# Write content to files
Set-Content -Path "src/App.tsx" -Value $appContent
Set-Content -Path "src/index.tsx" -Value $indexContent
Set-Content -Path "src/routes.tsx" -Value $routesContent

Write-Host "Directory structure created successfully!" -ForegroundColor Green