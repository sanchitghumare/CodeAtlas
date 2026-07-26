// app/manifest.js
export default function manifest() {
  return {
    name: 'CodeAtlas',
    short_name: 'CodeAtlas',
    description: 'AI Repo Review',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}