<template>
  <button
    :class="[baseClass, variantClass, sizeClass, 'transition-all duration-200']"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <svg v-if="loading" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
    <slot />
  </button>
</template>

<script setup>
const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  loading: Boolean,
  disabled: Boolean
})
const baseClass = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
const variants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 shadow-sm hover:shadow-glow',
  secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 focus:ring-primary-500 shadow-card hover:shadow-card-hover',
  ghost: 'hover:bg-gray-100 text-gray-600 focus:ring-gray-300',
  danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500',
  gradient: 'gradient-hero text-white focus:ring-primary-500 shadow-glow hover:shadow-glow-lg',
}
const sizes = {
  xs: 'px-2.5 py-1 text-xs', sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base', xl: 'px-8 py-4 text-lg'
}
const variantClass = variants[props.variant] || variants.primary
const sizeClass = sizes[props.size] || sizes.md
</script>
