import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryShade: 6,
  primaryColor: 'brandBlue',
  fontFamily: 'var(--gts-font-sans)',
  headings: {
    fontFamily: 'var(--gts-font-brand)',
    fontWeight: '700',
  },

  colors: {
    dark: [
      '#C1C2C5', '#A6A7AB', '#909296', '#5c5f66', '#373A40',
      '#26282d', '#1c1e24', '#14161b', '#101216', '#0f100c',
    ],
    brandBlue: [
      '#e8f1ff', '#cfe0ff', '#9ec0ff', '#6b9eff', '#4080ff',
      '#256eff', '#1864ff', '#0052e0', '#0047c7', '#003cad',
    ],
    brandCyan: [
      '#e6fcff', '#bef4ff', '#8ae9ff', '#54deff', '#29d4ff',
      '#0ecaff', '#00b8f5', '#009fd6', '#0087b8', '#006e99',
    ],
  },

  components: {
    Paper: {
      // Removed defaultProps: { bg: 'dark.7' } so Papers respect light/dark CSS variables
      styles: {
        root: {
          backgroundColor: 'var(--gts-bg-card)',
          border: '1px solid var(--gts-border-subtle)',
          color: 'var(--gts-text-body)',
        },
      },
    },
    Title: {
      styles: {
        root: {
          fontFamily: 'var(--gts-font-brand)',
          fontWeight: 700,
          letterSpacing: '0.05em',
        },
      },
    },
    Button: {
      styles: {
        root: {
          fontFamily: 'var(--gts-font-brand)',
          fontWeight: 700,
          letterSpacing: '0.05em',
        },
      },
    },
    Badge: {
      styles: {
        root: {
          fontFamily: 'var(--gts-font-brand)',
          fontWeight: 600,
          letterSpacing: '0.08em',
        },
      },
    },
  },
});