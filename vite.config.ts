import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default {
  plugins: [react()],
  // Переконайтеся, що розширення .jsx включені
  resolve: {
    extensions: ['.js', '.jsx']
  }
}
