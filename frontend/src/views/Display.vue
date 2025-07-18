<template>
    <Toast></Toast>
    <div class="flex h-screen w-full overflow-hidden">
        <div class="bg-emphasis relative flex flex-1 flex-col max-w-screen overflow-y-auto">
            <div class="flex flex-row items-center justify-between w-full">
                <div
                    class="bg-[var(--p-card-background)] text-lg mt-1 lg:mt-3 mx-1 lg:mx-3 p-2 lg:p-3 shadow rounded-xl">
                    Monitor: asd</div>
                <Button class="mx-1 lg:mx-3 mt-1 lg:mt-3" raised>Zgłoś problem</Button>
            </div>
            <div class="mx-1 mt-1 lg:mx-3 lg:mt-3 flex flex-1 flex-col items-center">
                <div class="flex flex-row flex-wrap gap-1 lg:gap-3 w-full items-stretch justify-center flex-1">
                    <Card class="flex-1 min-w-[55vw] lg:min-w-[35vw] min-h-[40vh]" v-for="i in [0, 1, 2]">
                        <template #content>
                            asd
                        </template>
                    </Card>
                </div>
            </div>

            <footer class="text-surface-300 p-3 text-center text-sm">
                &copy; {{ new Date().getFullYear() }} Warehouse Logistics - Nikodem Szwed.
            </footer>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import Button from 'primevue/button';
import { login } from '../services/authFunctions.js';
import Card from 'primevue/card';
import Form from '../components/Form/Form.vue';
import Toast from 'primevue/toast';
import { useToast } from 'primevue';
import { toggleDarkMode } from '../services/themeChanger.js';
import router from '../router/index.js';

const color = ref('var(--color-primary)');
const toast = useToast();

const darkMode = ref(document.documentElement.classList.contains('dark'));

const loginFields = ref([
    {
        name: 'login',
        label: 'Login',
        component: 'InputText',
        componentOptions: {
            type: 'text',
        },
        conditions: [{
            check: "required",
            message: "Login jest wymagany."
        }]
    },
    {
        name: 'password',
        label: 'Hasło',
        component: 'Password',
        componentOptions: {
            type: 'password',
            toggleMask: true,
            feedback: false
        },
        conditions: [{
            check: "required",
            message: "Hasło jest wymagane."
        }]
    }
]);

async function onFormSubmit(values) {
    try {
        await login(values.newObject.states.login.value, values.newObject.states.password.value);
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Wystąpił problem',
            detail: error.message,
            life: 6000
        });
    }

}

function darkModeChange() {
    darkMode.value = !darkMode.value;
    toggleDarkMode(darkMode.value);
}

function registerDevice() {
    router.push('/registerDevice');
}

</script>