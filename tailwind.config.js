/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{js,ts,jsx,tsx}',
        './index.html'
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                indigo: {
                    50: 'rgb(var(--theme-50) / <alpha-value>)',
                    100: 'rgb(var(--theme-100) / <alpha-value>)',
                    200: 'rgb(var(--theme-200) / <alpha-value>)',
                    300: 'rgb(var(--theme-300) / <alpha-value>)',
                    400: 'rgb(var(--theme-400) / <alpha-value>)',
                    500: 'rgb(var(--theme-500) / <alpha-value>)',
                    600: 'rgb(var(--theme-600) / <alpha-value>)',
                    700: 'rgb(var(--theme-700) / <alpha-value>)',
                    800: 'rgb(var(--theme-800) / <alpha-value>)',
                    900: 'rgb(var(--theme-900) / <alpha-value>)',
                    950: 'rgb(var(--theme-950) / <alpha-value>)',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace']
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-in': 'slideIn 0.2s ease-out',
                'scale-in': 'scaleIn 0.15s ease-out'
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' }
                },
                slideIn: {
                    '0%': { transform: 'translateX(-10px)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' }
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' }
                }
            }
        }
    },
    plugins: [require('@tailwindcss/typography')]
}
