<template>
    <!-- <div class="bg-red-200 h-[200vh]"> -->
    Dashboard. Welcome {{ name }}
    <!-- </div> -->
</template>

<script setup>
    import { ref } from 'vue';
    import { useUserStore } from '../stores/userData';

    const userData = useUserStore();
    const name = ref(userData.login);
</script>
