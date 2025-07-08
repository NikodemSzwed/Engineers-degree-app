import { updatePreset } from '@primeuix/themes';
import { useUserStore } from '../stores/userData';
import api from './api';

function changePrimaryColor(color = 'blue') {
    if (typeof color != 'string') {
        console.error('Color must be a string');
        return;
    }

    updatePreset({
        semantic: {
            primary: {
                50: `{${color}.50}`,
                100: `{${color}.100}`,
                200: `{${color}.200}`,
                300: `{${color}.300}`,
                400: `{${color}.400}`,
                500: `{${color}.500}`,
                600: `{${color}.600}`,
                700: `{${color}.700}`,
                800: `{${color}.800}`,
                900: `{${color}.900}`,
                950: `{${color}.950}`,
                // 50: `#ffffff`,
                // 100: `#ffffff`,
                // 200: `#ffffff`,
                // 300: `#ffffff`,
                // 400: `#ffffff`,
                // 500: `#ffffff`,
                // 600: `#ffffff`,
                // 700: `#ffffff`,
                // 800: `#ffffff`,
                // 900: `#ffffff`,
                // 950: `#ffffff`,
            },
        },
    });

    const userData = useUserStore();
    userData.personalSettings.primaryColor = color;
}

function toggleDarkMode(state = false) {
    if (state) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

    const userData = useUserStore();
    userData.personalSettings.darkMode = state;
}

async function saveTheme() {
    const userData = useUserStore();
    try {
        await api.put(`/users/` + userData.id, {
            PersonalSettings_json: JSON.stringify(userData.personalSettings),
        });
    } catch (error) {
        console.log(error);
    }
}

function loadTheme() {
    const userData = useUserStore();
    changePrimaryColor(userData.personalSettings.primaryColor);
    toggleDarkMode(userData.personalSettings.darkMode);
}

export { changePrimaryColor, toggleDarkMode, saveTheme, loadTheme };
