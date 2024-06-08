const env = require('dotenv').config().parsed;
module.exports = {
  apps: [
    {
      name: 'van-space-server',
      script: 'dist/src/main.js',
      autorestart: true,
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      // instances: 1,
      // max_memory_restart: env.APP_MAX_MEMORY || '150M',
      env: {
        NODE_ENV: 'production',
        ...env,
      },
    },
  ],
};
