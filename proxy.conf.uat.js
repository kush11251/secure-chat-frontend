const target = process.env.UAT_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:4000';

module.exports = {
  '/api': {
    target,
    changeOrigin: true,
    secure: false,
    logLevel: 'debug'
  },
  '/uploads': {
    target,
    changeOrigin: true,
    secure: false,
    logLevel: 'debug'
  },
  '/socket.io': {
    target,
    ws: true,
    changeOrigin: true,
    secure: false,
    logLevel: 'debug'
  }
};
