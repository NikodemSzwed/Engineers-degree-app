import { defineStore } from 'pinia';

export const useUserStore = defineStore('userData', {
    state: () => ({
        id: null,
        email: '',
        login: '',
        personalSettings: {},
        adminPrivileges: false,
    }),
    actions: {
        setUser(data) {
            this.id = data.id;
            this.email = data.email;
            this.login = data.login;
            this.personalSettings = JSON.parse(data.personalSettings);
            this.isAdmin = data.adminPrivileges || false;
        },
        clearUser() {
            this.$reset();
        },
    },
    persist: true,
});
