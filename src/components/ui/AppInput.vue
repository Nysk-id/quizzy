<template>
  <div>
    <label v-if="label" :for="id" class="label">{{ label }} <span v-if="required" class="text-red-500">*</span></label>
    <div class="relative">
      <div v-if="$slots.prefix" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><slot name="prefix" /></div>
      <input
        :id="id" :type="type" :placeholder="placeholder" :value="modelValue"
        :class="['input', error ? 'border-red-300 focus:ring-red-500' : '', $slots.prefix ? 'pl-10' : '', $slots.suffix ? 'pr-10' : '']"
        :disabled="disabled" :required="required" :autocomplete="autocomplete"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur', $event)" v-bind="$attrs"
      />
      <div v-if="$slots.suffix" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><slot name="suffix" /></div>
    </div>
    <p v-if="error" class="mt-1 text-xs text-red-600">{{ error }}</p>
    <p v-if="hint && !error" class="mt-1 text-xs text-gray-500">{{ hint }}</p>
  </div>
</template>
<script setup>
defineProps({
  id: String, label: String, type: { type: String, default: 'text' },
  placeholder: String, modelValue: [String, Number],
  error: String, hint: String, disabled: Boolean, required: Boolean, autocomplete: String
})
defineEmits(['update:modelValue', 'blur'])
</script>
