import { useEffect } from 'react'
import { Plus_Jakarta_Sans } from 'next/font/google'
import type { Decorator, Preview } from '@storybook/nextjs-vite'

import '../src/app/globals.css'

// Mirrors src/app/layout.tsx so stories resolve the same --font-sans token.
const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

// Applied to <html>/<body> rather than a wrapper div, the way layout.tsx does it:
// globals.css scopes its dark tokens to `.dark`, and portalled content (dialogs,
// dropdowns) mounts outside the story canvas.
function AppShell({ theme, children }: { theme: string; children: React.ReactNode }) {
  useEffect(() => {
    const html = document.documentElement
    html.classList.add(...plusJakarta.variable.split(' '), 'antialiased')
    html.classList.toggle('dark', theme === 'dark')
    document.body.classList.add('bg-background', 'font-sans', 'text-foreground')
  }, [theme])

  return <>{children}</>
}

const withAppShell: Decorator = (Story, { globals }) => (
  <AppShell theme={globals.theme === 'dark' ? 'dark' : 'light'}>
    <Story />
  </AppShell>
)

const preview: Preview = {
  decorators: [withAppShell],

  globalTypes: {
    theme: {
      description: 'Toggle the light/dark tokens defined in globals.css',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },

  initialGlobals: {
    theme: 'light',
  },

  parameters: {
    // The shell decorator paints the canvas, so the backgrounds addon would fight it.
    backgrounds: { disable: true },

    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
};

export default preview;
