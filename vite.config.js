import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { env } from 'process'
import child_process from 'child_process'


const baseFolder =
  env.APPDATA !== undefined && env.APPDATA !== ''
    ? `${env.APPDATA}/ASP.NET/https`
    : `${env.HOME}/.aspnet/https`;

const certificateName = "vite";
const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

if (!fs.existsSync(baseFolder)) {
  fs.mkdirSync(baseFolder, { recursive: true });
}

if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
  if (0 !== child_process.spawnSync('dotnet', [
    'dev-certs',
    'https',
    '--export-path',
    certFilePath,
    '--format',
    'Pem',
    '--no-password',
  ], { stdio: 'inherit', }).status) {
    throw new Error("Could not create certificate.");
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    minify: true,
    rollupOptions: {
      external: ['htm', 'react', 'react-dom'],
      input: {
        player: fileURLToPath(new URL('./index.html', import.meta.url))
      },
      output: {
        entryFileNames: 'scripts/panoplayer/assets/[name].js',
        // chunkFileNames: 'scripts/panoplayer/assets/components/[name].min.js',
        assetFileNames: 'scripts/panoplayer/assets/[name].[ext]',
        // manualChunks: {
        //     PlayerCarousel: ['./src/components/PlayerCarousel.vue'],
        //     PointsOfInterests: ['./src/components/PointsOfInterests.vue'],
        //     PlayerStatistics: ['./src/components/PlayerStatistics.vue'],
        //     PlayerWeather: ['./src/components/PlayerWeather.vue'],
        // }
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: 'dnndev.me',
    port: parseInt(env.DEV_SERVER_PORT || '443'),
    allowedHosts: ['dnndev.me'],
    //proxy: {
    //  '^/poi': {
    //    target,
    //    secure: false
    //  }
    //},
    https: {
      key: fs.readFileSync(keyFilePath),
      cert: fs.readFileSync(certFilePath),
    }
  }
})
