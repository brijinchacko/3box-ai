// PM2 Ecosystem Configuration for NXTED AI
// Run: pm2 start deploy/ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'nxted-ai',
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      cwd: '/var/www/nxtedai',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Logging
      error_file: '/var/log/pm2/nxted-ai-error.log',
      out_file: '/var/log/pm2/nxted-ai-out.log',
      log_file: '/var/log/pm2/nxted-ai-combined.log',
      time: true,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
