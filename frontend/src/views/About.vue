<template>
    Login. Welcome {{ name }}
    <tak></tak>
</template>

<script setup>
    import { ref } from 'vue';
    import { useUserStore } from '../stores/userData';
    import tak from '../components/tak.vue';

    const userData = useUserStore();
    const name = ref(userData.login);
</script>
