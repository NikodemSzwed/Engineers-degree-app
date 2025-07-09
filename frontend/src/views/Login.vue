<template>
    <div class="flex h-screen w-screen flex-col items-center justify-center bg-emphasis">
        <div class="flex flex-1 items-center justify-center pt-8">


            <Card class="h-fit w-fit ">
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
                    <div class="flex flex-col items-center gap-3">
                        Login. Welcome asd as kdinrfw nmntg n35 ng53 mh m5 6mh 647hj 467u j
                        <InputText></InputText>
                        <InputText></InputText>
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
import { useUserStore } from '../stores/userData';
import Button from 'primevue/button';
import { login, logout } from '../services/authFunctions.js';
import Card from 'primevue/card';
import { InputText } from 'primevue';

const userData = useUserStore();
const name = ref(userData.login);

const color = ref('var(--color-primary)');
</script>
