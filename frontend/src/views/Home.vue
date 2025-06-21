<template>
    Dashboard. Welcome {{ name }}
</template>

<script setup>
import { ref } from 'vue';
import { useUserStore } from '../stores/userData';

const userData = useUserStore();
const name = ref(userData.login);
</script>