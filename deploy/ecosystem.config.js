// PM2 Ecosystem Configuration for jobTED AI
// Run: pm2 start deploy/ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'jobted-ai',
      script: 'node_modules/.bin/next',
      args: 'start -p 3003',
      cwd: '/var/www/jobtedai',
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
      error_file: '/var/log/pm2/jobted-ai-error.log',
      out_file: '/var/log/pm2/jobted-ai-out.log',
      log_file: '/var/log/pm2/jobted-ai-combined.log',
      time: true,
      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
