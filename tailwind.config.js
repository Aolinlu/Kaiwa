/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 藍 (ai) — 主色，日式靛蓝
        ai: {
          50: '#eef2f8',
          100: '#dbe3f1',
          200: '#b7c7e2',
          300: '#8da4cf',
          400: '#5f7eb8',
          500: '#3f62a0',
          600: '#2f4d84',
          700: '#273f6b',
          800: '#1f3254',
          900: '#17253e',
        },
        // 朱 (shu) — 点缀色，朱红
        shu: {
          400: '#e0705a',
          500: '#d65f4d',
          600: '#b84a3a',
        },
        // 金 (kin) — 分数/星星
        kin: {
          400: '#d4af37',
          500: '#c9a227',
          600: '#a8861c',
        },
        // 生成り (kinari) — 和纸底色
        kinari: {
          50: '#faf8f3',
          100: '#f6f4ef',
          200: '#ece8de',
          300: '#ddd7c8',
        },
        // 墨 (sumi) — 墨色文字
        sumi: {
          500: '#5a5a66',
          600: '#3f3f4a',
          700: '#2b2b35',
          800: '#1d1d26',
        },
      },
      fontFamily: {
        jserif: ['"Noto Serif JP"', '"Hiragino Mincho ProN"', '"Yu Mincho"', 'YuMincho', '"MS PMincho"', 'serif'],
        jsans: ['"Noto Sans JP"', '"Hiragino Kaku Gothic ProN"', '"Yu Gothic"', 'YuGothic', '"MS PGothic"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        paper: '0 1px 2px rgba(23, 37, 62, 0.05), 0 4px 16px rgba(23, 37, 62, 0.06)',
        'paper-lg': '0 2px 4px rgba(23, 37, 62, 0.06), 0 12px 32px rgba(23, 37, 62, 0.1)',
      },
    },
  },
  plugins: [],
}
