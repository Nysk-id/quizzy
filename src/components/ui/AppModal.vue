<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeOnBackdrop && $emit('update:modelValue', false)" />
        <Transition name="scale-in">
          <div v-if="modelValue" :class="['relative bg-white rounded-2xl shadow-2xl w-full', maxWidthClass, 'animate-scale-in']">
            <div v-if="title || $slots.header" class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 class="text-lg font-semibold text-gray-900"><slot name="header">{{ title }}</slot></h3>
              <button v-if="showClose" @click="$emit('update:modelValue', false)" class="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div class="px-6 py-4"><slot /></div>
            <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end"><slot name="footer" /></div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
<script setup>
const props = defineProps({
  modelValue: Boolean, title: String, size: { type: String, default: 'md' },
  showClose: { type: Boolean, default: true }, closeOnBackdrop: { type: Boolean, default: true }
})
defineEmits(['update:modelValue'])
const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl', '2xl': 'max-w-2xl' }
const maxWidthClass = sizes[props.size] || sizes.md
</script>
