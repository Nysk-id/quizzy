<template>
  <span :class="['badge', colorClass]"><slot /></span>
</template>
<script setup>
const props = defineProps({ color: { type: String, default: 'gray' } })
const colors = {
  primary: 'badge-primary', success: 'badge-success', warning: 'badge-warning',
  danger: 'badge-danger', gray: 'badge-gray',
  purple: 'bg-purple-100 text-purple-700', blue: 'bg-blue-100 text-blue-700'
}
const colorClass = colors[props.color] || colors.gray
</script>
