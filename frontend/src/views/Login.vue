<template>
    <Toast></Toast>
    <div class="flex h-screen w-screen flex-col items-center justify-center bg-emphasis">
        <div class="w-full flex justify-end pt-5 pr-5">
            <div class="w-fit h-fit shadow bg-[var(--p-card-background)] p-2 rounded-md flex items-center justify-center cursor-pointer"
                @click="darkModeChange">
                <i v-if="!darkMode" class="pi pi-sun text-xl"></i>
                <i v-else class="pi pi-moon text-xl"></i>
            </div>
        </div>
        <div class="flex flex-1 items-center justify-center w-full">
            <Card class="h-fit w-fit">
                <template #title>
                    <div class="w-full flex justify-center items-center gap-3">
                        <div class="w-12 h-12 shadow dark:bg-emphasis p-2 rounded-md">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 132.292 132.292">
                                <defs>
                                    <path id="a" d="M17.657 63.062h467.08V500H17.657z" />
                                </defs>
                                <path :style="{ fill: color, stroke: color }"
                                    d="M25.36 14.051 8.337 38.523l25.885 79.83 15.783-18.465L66.145 61.2l16.141 38.688 15.784 18.465 25.884-79.83-17.023-24.472-15.148 57.03-25.637-56.903L41.53 71.463 25.36 14.051z"
                                    style="stroke-width:.670999" />
                            </svg>
                        </div>

                        <span>Warehouse Logistics</span>
                    </div>
                </template>
                <template #content>
                    <div class="flex flex-col items-center gap-3 p-5">
                        <div class="flex flex-col items-center gap-1 text-sm text-surface-500">
                            <div>Witaj w systemie Warehouse Logistics.</div>
                            <div> Zaloguj się aby przejść dalej!</div>
                        </div>

                        <Form :fields="loginFields" :submitLabel="'Zaloguj'" @submit="onFormSubmit">
                        </Form>
                        <Button label="zaloguj" class="w-fit" @click="login('Administrator', 'ZAQ12wsx@#')"></Button>
                        <Button label="zaloguj2" class="w-fit" @click="login('Kierownik', 'ZAQ12wsx@#')"></Button>
                    </div>

                </template>
            </Card>
        </div>

        <footer class="text-surface-300 p-3 text-center text-sm">
            &copy; {{ new Date().getFullYear() }} Warehouse Logistics - Nikodem Szwed.
        </footer>
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
</script>
