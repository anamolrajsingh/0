/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./index.html'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
            },
        }
    },
    plugins: [],
}
