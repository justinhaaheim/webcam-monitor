import '@fontsource/inter';

import Button from '@mui/joy/Button';
import CssBaseline from '@mui/joy/CssBaseline';
import {CssVarsProvider} from '@mui/joy/styles';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import packageJson from '../package.json';
import App from './App.tsx';
import ErrorBoundary from './ErrorBoundary.ts';

console.log('App Version:', packageJson.version);

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CssVarsProvider defaultMode="light">
      <CssBaseline />
      <ErrorBoundary
        fallback={(error, moduleName) => (
          <div
            style={{
              padding: 8,
            }}>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
              }}>{`Application encountered an error: ${error.message}\n\nModule Name: ${moduleName}`}</pre>
            <Button onClick={() => window.location.reload()} variant="solid">
              Reload App
            </Button>
          </div>
        )}>
        <App />
      </ErrorBoundary>
    </CssVarsProvider>
  </StrictMode>,
);
