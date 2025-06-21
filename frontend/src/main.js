import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPersistedState from 'pinia-plugin-persistedstate';
import './assets/main.css';
import router from './router';
import App from './App.vue';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPersistedState);
app.use(pinia);

app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            cssLayer: {
                name: 'primevue',
                order: 'theme, base, primevue',
            },
        },
    },
});

app.mount('#app');
