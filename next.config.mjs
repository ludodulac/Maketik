/** @type {import('next').NextConfig} */
const nextConfig={
  serverExternalPackages:[
    'node-edge-tts',
    'ws',
    'bufferutil',
    'utf-8-validate'
  ]
};

export default nextConfig;
