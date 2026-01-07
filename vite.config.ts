/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
    },
    server: {
        host: true,
        proxy: {
            // 代理阿里云 OSS 视频请求，绕过 CORS
            '/oss-video': {
                target: 'https://mycdn-gg.oss-us-west-1.aliyuncs.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/oss-video/, ''),
            },
        },
    },
})
