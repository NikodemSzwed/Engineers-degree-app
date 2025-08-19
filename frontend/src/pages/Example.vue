<template>
    <div>
        <Card :pt="{ body: 'p-2 lg:p-5' }">
            <template #content>
                <DataTable
                    :items="items"
                    :columns="columns"
                    :advancedFiltersAvailable="true"
                    :showInteractions="true"
                    :loading="loading"
                    @addItem="addItem"
                    @editItem="editItem"
                    @deleteItem="deleteItem"
                >
                    <template #body-custom="{ data }">
                        <div :class="data.custom.value">{{ data.custom.name }}</div>
                    </template>
                    <template #filter-custom="{ filterModel }">
                        <MultiSelect v-model="filterModel.value" :options="colors" optionLabel="name" filter showClear>
                            <template #option="slotProps">
                                <div :class="slotProps.option.value">{{ slotProps.option.name }}</div>
                            </template>
                            <template #value="slotProps">
                                <div v-for="color of slotProps.value" :class="color.value">{{ color.name }}</div>
                            </template>
                        </MultiSelect>
                    </template>
                </DataTable>
            </template>
        </Card>
        <Dialog v-model:visible="addItemDialogVisible" header="Dodaj użytkownika" class="w-11/12 lg:w-1/3" modal>
            <Form :fields="addItemFields" @submit="addItemSave">
                <template #input-custom="{ field, $field }">
                    {{ field.label }} {{ $field }}
                    <input
                        type="text"
                        v-model="$field.value"
                        @input="$field.onInput"
                        @blur="$field.onBlur"
                        @change="$field.onChange"
                    />
                </template>
            </Form>
        </Dialog>
        <Dialog v-model:visible="editItemDialogVisible" header="Edytuj użytkownika" class="w-11/12 lg:w-1/3" modal>
            <Form :initial-values="initialValues" :fields="editItemFields" @submit="editItemSave" />
        </Dialog>
    </div>
</template>

<script setup>
    import { onMounted, ref } from 'vue';
    import { useToast } from 'primevue/usetoast';
    import Card from 'primevue/card';
    import Dialog from 'primevue/dialog';
    import DataTable from '../components/DataTable/DataTable.vue';
    import api from '../services/api';
    import { MultiSelect } from 'primevue';
    import { FilterMatchMode, FilterOperator } from '@primevue/core/api';
    import Form from '../components/Form/Form.vue';

    const toast = useToast();

    const items = ref([]);
    const addItemDialogVisible = ref(false);
    const editItemDialogVisible = ref(false);

    const adjectives = ['Red', 'Big', 'Small', 'Old', 'New', 'Long', 'Round', 'Flat', 'Green', 'Blue'];
    const nouns = ['Pen', 'Pencil', 'Book', 'Desk', 'Chair', 'Door', 'Window', 'Car', 'Bike', 'Table'];

    const categories = [
        'Writing',
        'Painting',
        'Sculpture',
        'Architecture',
        'Design',
        'Art',
        'Photography',
        'Music',
        'Dance',
        'Theater',
    ];
    const colors = [
        { name: 'Blue', value: 'bg-blue-500' },
        { name: 'Red', value: 'bg-red-500' },
        { name: 'Green', value: 'bg-green-500' },
        { name: 'Yellow', value: 'bg-yellow-500' },
        { name: 'Orange', value: 'bg-orange-500' },
        { name: 'Purple', value: 'bg-purple-500' },
        { name: 'Pink', value: 'bg-pink-500' },
        { name: 'Teal', value: 'bg-teal-500' },
    ];

    const initialValues = ref({
        // login: 'dame',
        // email: 'asd2@wp.pl',
        // password: '123',
        // passwordRepeat: '123',
    });

    // const customPasswordResolver = ({ value }) => {
    //     const errors = [];
    //     console.log("🚀 ~ customPasswordResolver ~ value:", value)
    //     if (!value) {
    //         errors.push({ message: 'Password is required via Custom.' });
    //         errors.push({ message: 'Password is required via Custom2.' });
    //     }

    //     return {
    //         errors
    //     };
    // };
    const addItemFields = ref([
        {
            name: 'login',
            // initialValue: '',
            label: 'Login',
            component: 'InputText',
            componentOptions: {
                type: 'text',
            },
            conditions: [
                {
                    check: 'required',
                    message: 'Login jest wymagany.',
                },
                {
                    check: 'minlength',
                    value: 3,
                    message: 'Login musi zawierać co najmniej 3 znaki.',
                },
                {
                    check: 'maxlength',
                    value: 25,
                    message: 'Login musi zawierać co najwyżej 25 znaków.',
                },
                // {
                //     check: "eqlength",
                //     value: 10,
                //     message: "Login must be exactly 10 characters."
                // },
                {
                    check: 'regex',
                    value: '^[a-zA-Z0-9]+$',
                    message: 'Login może się składać tylko z liter i cyfr.',
                },
            ],
        },
        {
            name: 'email',
            // initialValue: 'asd@wp.pl',
            label: 'Email',
            component: 'InputText',
            componentOptions: {
                type: 'text',
            },
            conditions: [
                {
                    check: 'regex',
                    value: '^\\w+([\\-\\.]\\w+)*@([\\w\\-]+\\.)+[\\w\\-]{2,4}$',
                    message: 'Email nie jest prawidłowy.',
                },
            ],
        },
        {
            name: 'password',
            // initialValue: '',
            label: 'Hasło',
            component: 'Password',
            componentOptions: {
                type: 'password',
                toggleMask: true,
            },
            conditions: [
                {
                    check: 'required',
                    message: 'Hasło jest wymagane.',
                },
            ],
            // resolver: customPasswordResolver
        },
        {
            name: 'passwordRepeat',
            // initialValue: '',
            label: 'Powtórz hasło',
            component: 'Password',
            componentOptions: {
                type: 'password',
                toggleMask: true,
                feedback: false,
            },
            conditions: [
                {
                    check: 'custom',
                    message: 'Hasła nie są identyczne.',
                    function: values => values.password !== values.passwordRepeat,
                },
            ],
        },
        {
            name: 'custom',
            label: 'Ustawienia personalne',
            component: 'custom',
        },
    ]);

    const editItemFields = ref([
        {
            name: 'login',
            // initialValue: '',
            label: 'Login',
            component: 'InputText',
            componentOptions: {
                type: 'text',
            },
            conditions: [
                {
                    check: 'required',
                    message: 'Login jest wymagany.',
                },
                {
                    check: 'minlength',
                    value: 3,
                    message: 'Login musi zawierać co najmniej 3 znaki.',
                },
                {
                    check: 'maxlength',
                    value: 25,
                    message: 'Login musi zawierać co najwyżej 25 znaków.',
                },
                // {
                //     check: "eqlength",
                //     value: 10,
                //     message: "Login must be exactly 10 characters."
                // },
                {
                    check: 'regex',
                    value: '^[a-zA-Z0-9]+$',
                    message: 'Login może się składać tylko z liter i cyfr.',
                },
            ],
        },
        {
            name: 'email',
            // initialValue: 'asd@wp.pl',
            label: 'Email',
            component: 'InputText',
            componentOptions: {
                type: 'text',
            },
            conditions: [
                {
                    check: 'regex',
                    value: '^\\w+([\\-\\.]\\w+)*@([\\w\\-]+\\.)+[\\w\\-]{2,4}$',
                    message: 'Email nie jest prawidłowy.',
                },
            ],
        },
        {
            name: 'password',
            // initialValue: '',
            label: 'Nowe Hasło (opcjonalne)',
            component: 'Password',
            componentOptions: {
                type: 'password',
                toggleMask: true,
            },
            optional: true,
            // resolver: customPasswordResolver
        },
        {
            name: 'passwordRepeat',
            // initialValue: '',
            label: 'Powtórz nowe hasło (opcjonalne)',
            component: 'Password',
            componentOptions: {
                type: 'password',
                toggleMask: true,
                feedback: false,
            },
            optional: true,
            conditions: [
                {
                    check: 'custom',
                    message: 'Hasła nie są identyczne.',
                    function: values => {
                        return values.password !== values.passwordRepeat;
                    },
                },
            ],
        },
        // {
        //     name: 'userUIDs',
        //     label: 'Lista użytkowników',
        //     component: 'PickList',
        //     initialValue: [["1", "2"], []],
        //     componentOptions: {
        //         pt: {
        //             sourceControls: {
        //                 class: "hidden"
        //             },
        //             targetControls: {
        //                 class: "hidden"
        //             }
        //         }
        //     },
        //     conditions: [{
        //         check: "required",
        //         message: "Lista użytkowników jest wymagana."
        //     }]
        // },
    ]);

    // const resolver = ({ values }) => {
    //     console.log("🚀 ~ resolver ~ values:", values)
    //     return {
    //         errors: {}
    //     }
    // }

    const columns = ref([
        // { label: 'Id', field: 'id', type: 'numeric', dataKey: true, show: false },
        // { label: 'Code', field: 'code', type: 'text', addToGlobalFilter: true },
        // { label: 'Name', field: 'name', type: 'text', addToGlobalFilter: true },
        // {
        //     label: 'Custom', field: 'custom', type: 'any',
        //     overrideBodyTemplate: true,
        //     overrideFilterTemplate: true,
        //     colProps: {
        //         showFilterMatchModes: false,
        //         showFilterOperator: false,
        //         showAddButton: false,
        //         sortField: 'custom.name'
        //     },
        //     overrideFilter: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.IN }] }
        // },
        // { label: 'Category', field: 'category', type: 'list', options: categories },
        // { label: 'Quantity', field: 'quantity', type: 'numeric' },
        // { label: 'Created', field: 'created', type: 'date', dateFormat: 'dd.MM.yyyy', showTime: true, timeFormat: 'HH:mm' },

        { label: 'UID', field: 'UID', type: 'numeric', dataKey: true, show: false },
        { label: 'Login', field: 'login', type: 'text', addToGlobalFilter: true },
        { label: 'Email', field: 'email', type: 'text', addToGlobalFilter: true },
        { label: 'Ustawienia personalne', field: 'personallSettings', type: 'text', show: false },
    ]);

    const loading = ref(true);

    onMounted(async () => {
        try {
            let response = await api.get('/users');
            items.value = response.data;
        } catch (error) {
            console.log('🚀 ~ onMounted ~ error:', error);
        }
        loading.value = false;

        // for (let i = 0; i < 200; i++) {
        //     const ele = {
        //         id: i,
        //         code: Array(6).fill('').map(() => (Math.random() < 0.5 ? String.fromCharCode(Math.floor(Math.random() * 26) + 97) : Math.floor(Math.random() * 10).toString())).join(''),
        //         name: adjectives[Math.floor(Math.random() * adjectives.length)] + ' ' + nouns[Math.floor(Math.random() * nouns.length)] + '' + i,
        //         category: categories[Math.floor(Math.random() * categories.length)],
        //         quantity: Math.floor(Math.random() * 90) + 10,
        //         created: new Date(Date.now() + (Math.floor(Math.random() * 31) - 15) * 24 * 60 * 60 * 1000),
        //         custom: colors[Math.floor(Math.random() * colors.length)],

        //     };

        //     products.value.push(ele);
        // }

        // setTimeout(() => { loading.value = false; }, 2000);

        console.log('🚀 ~ products.value:', items.value);
    });

    function addItem() {
        addItemDialogVisible.value = true;
    }

    async function addItemSave(values) {
        let payload = Object.fromEntries(Object.entries(values.newObject.states).map(([key, obj]) => [key, obj.value]));
        payload.passwd = payload.password;
        delete payload.passwordRepeat;
        delete payload.password;

        try {
            let response = await api.post('/users', payload);

            delete response.data.passwd;

            items.value.push(response.data);

            toast.add({
                severity: 'success',
                summary: 'Dodano użytkownika',
                detail: 'Pomyślnie dodano użytkownika',
                life: 2000,
            });
        } catch (error) {
            console.log('🚀 ~ addItemSave ~ error:', error);
            toast.add({
                severity: 'error',
                summary: 'Wystąpił problem',
                detail: 'Nie udało się dodać użytkownika. Powód: ' + error.response.data.error,
                life: 6000,
            });
        }

        addItemDialogVisible.value = false;
    }

    function editItem(item) {
        if (!item) {
            toast.add({
                severity: 'warn',
                summary: 'Nie wybrano użytkownika',
                detail: 'Wybierz użytkownika którego chcesz zmodyfikować',
                life: 3000,
            });
            return;
        }

        initialValues.value = item;
        editItemDialogVisible.value = true;
    }

    async function editItemSave(values) {
        let payload = Object.fromEntries(Object.entries(values.newObject.states).map(([key, obj]) => [key, obj.value]));
        delete payload.passwordRepeat;

        try {
            await api.put('/users/' + values.originalObject.UID, payload);

            delete payload.password;

            Object.assign(items.value[items.value.indexOf(values.originalObject)], payload);
            toast.add({
                severity: 'success',
                summary: 'Zmodyfikowano użytkownika',
                detail: 'Pomyślnie zmodyfikowano użytkownika',
                life: 2000,
            });
        } catch (error) {
            toast.add({
                severity: 'error',
                summary: 'Wystąpił problem',
                detail: 'Nie udało się zmodyfikować użytkownika. Powód: ' + error.response.data.error,
                life: 6000,
            });
        }

        editItemDialogVisible.value = false;
    }

    async function deleteItem(item) {
        if (!item) {
            toast.add({
                severity: 'warn',
                summary: 'Nie wybrano użytkownika',
                detail: 'Wybierz użytkownika którego chcesz usunąć',
                life: 3000,
            });
            return;
        }

        try {
            await api.delete('/users/' + item.UID);
            items.value.splice(items.value.indexOf(item), 1);
            toast.add({
                severity: 'success',
                summary: 'Usunięto użytkownika',
                detail: 'Pomyślnie usunięto użytkownika',
                life: 2000,
            });
        } catch (error) {
            toast.add({
                severity: 'error',
                summary: 'Wystąpił problem',
                detail: 'Nie udało się usunąć użytkownika. Powód: ' + error.response.data.error,
                life: 6000,
            });
        }
    }
</script>
