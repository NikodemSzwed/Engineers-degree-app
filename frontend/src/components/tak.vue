<template>
    <div>
        <Button label="zaloguj" @click="login('Administrator', 'ZAQ12wsx@#')"></Button>
        <Button label="wyloguj" @click="logout"></Button>
    </div>

</template>

<script setup>
import Button from 'primevue/button';
import { login, logout } from '../services/authFunctions.js';
</script>
