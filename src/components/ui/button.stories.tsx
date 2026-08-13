import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect } from 'storybook/test'
import { ArrowRight, Plus, Trash2 } from 'lucide-react'

import { Button } from './button'

const VARIANTS = [
  'default',
  'outline',
  'secondary',
  'ghost',
  'destructive',
  'link',
] as const

const SIZES = ['xs', 'sm', 'default', 'lg'] as const
const ICON_SIZES = ['icon-xs', 'icon-sm', 'icon', 'icon-lg'] as const

const meta = {
  component: Button,
  parameters: { layout: 'centered' },
  args: {
    children: 'Add contact',
    variant: 'default',
    size: 'default',
    disabled: false,
  },
  argTypes: {
    variant: { control: 'select', options: VARIANTS },
    size: { control: 'select', options: [...SIZES, ...ICON_SIZES] },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

/** Playground — drive every prop from the controls panel. */
export const Default: Story = {}

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {VARIANTS.map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
}

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {SIZES.map((size) => (
        <Button key={size} {...args} size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
}

/**
 * The `data-icon` attribute is what trims the padding on the icon's side —
 * see the `has-data-[icon=…]` rules in `buttonVariants`.
 */
export const WithIcon: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args}>
        <Plus data-icon="inline-start" />
        Add contact
      </Button>
      <Button {...args} variant="outline">
        Continue
        <ArrowRight data-icon="inline-end" />
      </Button>
      <Button {...args} variant="destructive">
        <Trash2 data-icon="inline-start" />
        Delete
      </Button>
    </div>
  ),
}

export const IconOnly: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      {ICON_SIZES.map((size) => (
        <Button key={size} {...args} size={size} variant="outline" aria-label={`Add (${size})`}>
          <Plus />
        </Button>
      ))}
    </div>
  ),
}

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: /add contact/i })
    await expect(button).toBeDisabled()
  },
}
