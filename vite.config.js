import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
    },
    caseSensitive: true, // 대소문자 민감하게 설정
  },
});
