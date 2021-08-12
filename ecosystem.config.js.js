module.exports = {
  apps: [
    {
      name: 'Prod',
      script: 'production/ts-built/server.js',
      env: {
        NODE_ENV: 'production',
        SERVER_PORT: 4200,
      },
      instances: 3,
      exec_mode: 'cluster',
    },
    {
      name: 'Stag',
      script: 'staging/ts-built/server.js',
      env: {
        NODE_ENV: 'staging',
        SERVER_PORT: 4400,
      },
      instances: 3,
      exec_mode: 'cluster',
    },
  ],
};
