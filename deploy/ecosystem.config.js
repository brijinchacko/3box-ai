// PM2 Ecosystem Configuration for 3BOX AI
// Run: pm2 start deploy/ecosystem.config.js

module.exports = {
  apps: [
    {
      name: '3box-ai',
      script: 'node_modules/.bin/next',
      args: 'start -p 3003',
      cwd: '/var/www/3boxai',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
      // Logging
      error_file: '/var/log/pm2/3box-ai-error.log',
      out_file: '/var/log/pm2/3box-ai-out.log',
      log_file: '/var/log/pm2/3box-ai-combined.log',
      time: true,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
