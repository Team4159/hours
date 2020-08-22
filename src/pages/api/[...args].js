import { createProxyMiddleware } from 'http-proxy-middleware';

export default createProxyMiddleware({
  target: process.env.NEXT_PUBLIC_API_URL,
  pathRewrite: {
    '^/api': ''
  },
  changeOrigin: true
});
