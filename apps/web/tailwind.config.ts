import type { Config } from "tailwindcss"

const config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Enhanced responsive screens
    screens: {
      'xs': '360px',    // Extra small devices
      'sm': '640px',    // Small devices
      'md': '768px',    // Medium devices (tablets)
      'lg': '1024px',   // Large devices (laptops)
      'xl': '1280px',   // Extra large devices
      '2xl': '1536px',  // 2X large devices
    },
    container: {
      center: true,
      padding: {
        'DEFAULT': '1rem',
        'xs': '0.5rem',
        'sm': '1rem',
        'md': '1.5rem',
        'lg': '2rem',
        'xl': '2.5rem',
        '2xl': '3rem',
      },
      screens: {
        'sm': '100%',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: "rgb(var(--border))",
        input: "rgb(var(--input))",
        ring: "rgb(var(--ring))",
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        primary: {
          DEFAULT: "rgb(var(--primary))",
          foreground: "rgb(var(--primary-foreground))",
          hover: "rgb(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary))",
          foreground: "rgb(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive))",
          foreground: "rgb(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "rgb(var(--muted))",
          foreground: "rgb(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "rgb(var(--accent))",
          foreground: "rgb(var(--accent-foreground))",
          hover: "rgb(var(--accent-hover))",
        },
        popover: {
          DEFAULT: "rgb(var(--popover))",
          foreground: "rgb(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "rgb(var(--card))",
          foreground: "rgb(var(--card-foreground))",
        },
        brand: {
          "dark-blue": "rgb(var(--brand-dark-blue))",
          "dark-blue-light": "rgb(var(--brand-dark-blue-light))",
          "orange": "rgb(var(--brand-orange))",
          "orange-light": "rgb(var(--brand-orange-light))",
        },
        success: {
          DEFAULT: "rgb(var(--success))",
          foreground: "rgb(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "rgb(var(--warning))",
          foreground: "rgb(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "rgb(var(--info))",
          foreground: "rgb(var(--info-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        'responsive-2xs': 'clamp(0.25rem, 0.5vw, 0.5rem)',
        'responsive-xs': 'clamp(0.5rem, 1vw, 1rem)',
        'responsive-sm': 'clamp(1rem, 2vw, 1.5rem)',
        'responsive-md': 'clamp(1.5rem, 3vw, 2rem)',
        'responsive-lg': 'clamp(2rem, 4vw, 2.5rem)',
        'responsive-xl': 'clamp(2.5rem, 5vw, 3rem)',
        'responsive-2xl': 'clamp(3rem, 6vw, 4rem)',
      },
      fontSize: {
        'responsive-xs': 'clamp(0.75rem, 2vw, 0.875rem)',
        'responsive-sm': 'clamp(0.875rem, 2.5vw, 1rem)',
        'responsive-base': 'clamp(1rem, 2.5vw, 1.125rem)',
        'responsive-lg': 'clamp(1.125rem, 3vw, 1.25rem)',
        'responsive-xl': 'clamp(1.25rem, 3.5vw, 1.5rem)',
        'responsive-2xl': 'clamp(1.5rem, 4vw, 1.875rem)',
        'responsive-3xl': 'clamp(1.875rem, 5vw, 2.25rem)',
        'responsive-4xl': 'clamp(2.25rem, 6vw, 3rem)',
        'responsive-5xl': 'clamp(3rem, 7vw, 3.75rem)',
      },
      maxWidth: {
        "5xl": "64rem",
        "7xl": "80rem",
        "8xl": "88rem",
        "responsive": "clamp(100%, 90vw, 1280px)",
      },
      minHeight: {
        "screen-responsive": "clamp(100vh, 100dvh, 100vh)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
