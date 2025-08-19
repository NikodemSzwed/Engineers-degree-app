<template>
    <div class="flex w-full justify-center">
        <Toast />
        <Card class="w-fit">
            <template #content>
                <div class="flex flex-col justify-center gap-5">
                    <div class="flex flex-col items-center gap-5 lg:flex-row">
                        <div class="w-full min-w-52 text-lg font-semibold lg:w-fit">Kolor dominujący:</div>
                        <div class="flex w-full flex-row flex-wrap justify-center gap-3 lg:justify-start">
                            <div
                                v-for="color in definedColor"
                                class="bg-emphasis hover:bg-highlight-emphasis flex h-25 w-32 flex-col items-center justify-center gap-2 rounded-lg p-2 shadow hover:cursor-pointer"
                                @click="
                                    typeof color.color == 'string'
                                        ? changePrimaryColor(color.color)
                                        : changePrimaryColorToCustom(color.color)
                                "
                            >
                                <div class="h-7 w-7 rounded-md" :style="{ backgroundColor: color.value }"></div>
                                {{ color.label }}
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-row items-center gap-5">
                        <div class="min-w-52 text-lg font-semibold">Dark mode:</div>
                        <ToggleSwitch v-model="checked" @change="toggleDarkMode(checked)" />
                    </div>
                    <Button label="Zapisz" icon="pi pi-check" @click="saveTheme(toast)" class="w-fit">Zapisz</Button>
                </div>
            </template>
        </Card>
    </div>
</template>

<script setup>
    import Card from 'primevue/card';
    import { ref } from 'vue';
    import { Button } from 'primevue';
    import ToggleSwitch from 'primevue/toggleswitch';
    import {
        changePrimaryColor,
        changePrimaryColorToCustom,
        toggleDarkMode,
        saveTheme,
    } from '../services/themeChanger';
    import { useUserStore } from '../stores/userData';
    import Toast from 'primevue/toast';
    import { useToast } from 'primevue/usetoast';

    const toast = useToast();
    const userData = useUserStore();
    const checked = ref(userData.personalSettings.darkMode);

    const definedColor = ref([
        {
            label: 'Czerwony',
            value: 'var(--color-red-500)',
            color: 'red',
        },
        {
            label: 'Zielony',
            value: 'var(--color-green-500)',
            color: 'green',
        },
        {
            label: 'Niebieski',
            value: 'var(--color-blue-500)',
            color: 'blue',
        },
        {
            label: 'Fioletowy',
            value: 'var(--color-indigo-500)',
            color: 'indigo',
        },
        {
            label: 'Żółty',
            value: 'var(--color-yellow-500)',
            color: 'yellow',
        },
        {
            label: 'Pomarańczowy',
            value: 'var(--color-orange-500)',
            color: 'orange',
        },
        {
            label: 'Różowy',
            value: '#ec4899',
            color: {
                50: '#fdf2f8',
                100: '#fce7f3',
                200: '#fbcfe8',
                300: '#f9a8d4',
                400: '#f472b6',
                500: '#ec4899',
                600: '#db2777',
                700: '#be185d',
                800: '#9d174d',
                900: '#831843',
                950: '#500724',
            },
        },
    ]);
</script>
