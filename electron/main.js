const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let pythonProcess;
let serverProcess;

// Get the correct paths for resources
function getResourcePath(relativePath) {
  if (isDev) {
    return path.join(__dirname, '..', relativePath);
  }
  return path.join(process.resourcesPath, relativePath);
}

function startBackend() {
  const backendPath = getResourcePath('python-backend/CertificateBackend.exe');
  
  console.log('Starting backend from:', backendPath);
  
  pythonProcess = spawn(backendPath, [], {
    cwd: path.dirname(backendPath)
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Backend exited with code ${code}`);
  });
}

function startNextServer() {
  if (isDev) {
    // In development, use npm run dev
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    serverProcess = spawn(npm, ['run', 'dev'], {
      cwd: path.join(__dirname, '..', 'nextjs-frontend'),
      shell: true
    });
  } else {
    // In production, use Next.js standalone server
    const nextServerPath = getResourcePath('nextjs-frontend/.next/standalone/server.js');
    serverProcess = spawn('node', [nextServerPath], {
      cwd: path.dirname(nextServerPath),
      env: {
        ...process.env,
        PORT: '3000'
      }
    });
  }

  if (serverProcess) {
    serverProcess.stdout.on('data', (data) => {
      console.log(`Next.js: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Next.js Error: ${data}`);
    });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: path.join(__dirname, 'icon.ico'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Show loading screen
  mainWindow.loadFile(path.join(__dirname, 'loading.html'));

  // Wait for servers then load app
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000');
  }, 5000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  console.log('App starting...');
  startBackend();
  startNextServer();
  
  setTimeout(() => {
    createWindow();
  }, 3000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
  if (serverProcess) {
    serverProcess.kill();
  }
});