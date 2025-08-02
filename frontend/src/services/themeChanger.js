import { updatePreset } from '@primeuix/themes';
import { useUserStore } from '../stores/userData';
import api from './api';

function changePrimaryColor(color = 'blue') {
    if (typeof color != 'string') {
        console.error('Color must be a string');
        return;
    }

    let colorObject = {
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
    };

    changePrimaryColorToCustom(colorObject);
}

function changePrimaryColorToCustom(colorObject) {
    if (typeof colorObject != 'object') {
        console.error('Color must be a valid object');
        return;
    }

    // colorObject = {
    //     50: `#ffffff`,
    //     100: `#ffffff`,
    //     200: `#ffffff`,
    //     300: `#ffffff`,
    //     400: `#ffffff`,
    //     500: `#ffffff`,
    //     600: `#ffffff`,
    //     700: `#ffffff`,
    //     800: `#ffffff`,
    //     900: `#ffffff`,
    //     950: `#ffffff`,
    // };

    updatePreset({
        semantic: {
            primary: colorObject,
        },
    });

    const userData = useUserStore();
    userData.personalSettings.primaryColor = colorObject;
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
    changePrimaryColorToCustom(userData.personalSettings.primaryColor);
    toggleDarkMode(userData.personalSettings.darkMode);
}

function loadDefaultTheme() {
    changePrimaryColor();
    toggleDarkMode();
}

function hexToRgb(hex) {
    const hexRegex = /^#([0-9A-F]{6})$/i;
    if (!hexRegex.test(hex)) {
        console.error('Color must be a valid hex color with 6 letters. Short hex colors are not supported.');
        return;
    }

    hex = hex.replace(/^#/, '');
    return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
    };
}
function rgbToHexString(r, g, b) {
    const toHex = x => x.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function blendColors(c0, c1, weight = 0.5) {
    const rgb0 = hexToRgb(c0);
    const rgb1 = hexToRgb(c1);

    const r = Math.round(rgb0.r * (1 - weight) + rgb1.r * weight);
    const g = Math.round(rgb0.g * (1 - weight) + rgb1.g * weight);
    const b = Math.round(rgb0.b * (1 - weight) + rgb1.b * weight);

    return rgbToHexString(r, g, b);
}

function hexToRgbaString(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export { saveTheme, loadTheme, loadDefaultTheme };
export { changePrimaryColor, toggleDarkMode };
export { blendColors, hexToRgbaString, rgbToHexString };
