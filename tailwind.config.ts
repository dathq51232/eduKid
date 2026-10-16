import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        edu: {
          navy: '#19324D',
          blue: '#4F7DF3',
          mint: '#BDEBD8',
          yellow: '#FFD66B',
          cream: '#FFF9ED',
        },
      },
    },
  },
  plugins: [],
};

export default config;
