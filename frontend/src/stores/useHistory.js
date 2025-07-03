import { defineStore } from 'pinia';

export const useHistory = defineStore('history', {
    state: () => ({ list: [] }),
    actions: {
        push(path) {
            if (this.list.includes(path)) {
                this.list.splice(this.list.indexOf(path), 1);
            }

            let forbbiden = ['/', '/login', '/dashboard'];

            if (this.list[0] !== path && !forbbiden.includes(path)) {
                this.list.unshift(path);
                if (this.list.length > 5) this.list.pop();
            }
        },
        clear() {
            this.list = [];
        },
    },
    persist: true,
});
