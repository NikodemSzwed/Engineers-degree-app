<template>

    <Button label="zaloguj" @click="login"></Button>
    <Button label="wyloguj" @click="logout"></Button>
</template>

<script setup>
import api from '../services/api.js';
import Button from 'primevue/button';
import { useRouter } from 'vue-router';
import { startAuthRefresh, stopAuthRefresh } from '../services/tokenRefresh.js';

const router = useRouter();

async function login() {
    try {
        await api.post('/users/login', {
            "login": "Administrator",
            "passwd": "ZAQ12wsx@#"
        });

        startAuthRefresh();
        router.push('/');
    } catch (error) {
        console.log('Login failed', error.response.data);

    }
}

async function logout() {
    try {
        await api.post('/users/logout');
    } catch (error) {
        console.log('Logout failed', error.response.data);
    }
    stopAuthRefresh();
    router.push('/login');
}


</script>