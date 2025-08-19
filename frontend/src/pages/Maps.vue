<template>
    <div>
        <Card :pt="{ body: 'p-2 lg:p-5' }">
            <template #content>
                <DataTable
                    :items="items"
                    :columns="columns"
                    :advancedFiltersAvailable="true"
                    :showInteractions="true"
                    :showAddButton="admin"
                    :showDeleteButton="admin"
                    :loading="loading"
                    @addItem="addItem"
                    @editItem="editItem"
                    @deleteItem="deleteItem"
                    @showAdvancedObjectView="showAdvancedObjectView"
                >
                </DataTable>
            </template>
        </Card>
        <Dialog v-model:visible="addItemDialogVisible" header="Dodaj mapę" class="w-11/12 lg:w-1/2" modal>
            <Form :fields="addItemFields" @submit="addItemSave" />
        </Dialog>
        <Dialog
            v-model:visible="editItemDialogVisible"
            header="Edytuj mapę"
            class="w-11/12 lg:w-3/4"
            modal
            maximizable
            :pt="{ content: 'bg-emphasis rounded-b-xl pt-5' }"
        >
            <div class="flex h-full min-h-[75vh] w-full">
                <MapInterface
                    v-model:value="selectedItem"
                    :editAvailable="true"
                    :upperBarVisible="true"
                    :advancedViewAvailable="true"
                    :data="initialValues"
                    @save="editItemSave"
                >
                </MapInterface>
            </div>
        </Dialog>
        <Dialog
            v-model:visible="advancedObjectViewVisible"
            header="Podgląd mapy"
            class="w-11/12 lg:w-3/4"
            modal
            maximizable
            :pt="{ content: 'bg-emphasis rounded-b-xl pt-5' }"
        >
            <div class="flex h-full min-h-[75vh] w-full">
                <MapInterface :upperBarVisible="true" :advancedViewAvailable="true" :data="showItem"> </MapInterface>
            </div>
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
    import Form from '../components/Form/Form.vue';
    import { toastHandler } from '../services/toastHandler';
    import MapInterface from '../components/Map/MapInterface.vue';
    import { useUserStore } from '../stores/userData';

    const toast = useToast();
    const userData = useUserStore();
    const admin = ref(userData.isAdmin);

    const items = ref([]);
    const addItemDialogVisible = ref(false);
    const editItemDialogVisible = ref(false);

    const advancedObjectViewVisible = ref(false);
    const showItem = ref([]);
    const selectedItem = ref(null);

    const mainKey = 'EID';
    const mainPath = '/mapsandelements';

    const initialValues = ref({});

    const addItemFields = ref([
        {
            name: 'name',
            label: 'Nazwa mapy',
            component: 'InputText',
            componentOptions: {
                type: 'text',
            },
            conditions: [
                {
                    check: 'required',
                    message: 'Nazwa mapy jest wymagana.',
                },
                {
                    check: 'minlength',
                    value: 3,
                    message: 'Nazwa mapy musi zawierać co najmniej 3 znaki.',
                },
                {
                    check: 'maxlength',
                    value: 25,
                    message: 'Nazwa mapy musi zawierać co najwyżej 25 znaków.',
                },
            ],
        },
    ]);

    const columns = ref([
        { label: 'EID', field: 'EID', type: 'numeric', dataKey: true, show: false },
        { label: 'Nazwa', field: 'name', type: 'text', addToGlobalFilter: true },
    ]);

    const loading = ref(true);

    onMounted(async () => {
        try {
            let groups = api.get(mainPath);

            items.value = (await groups).data;
        } catch (error) {
            toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych.'));
        }
        loading.value = false;
    });

    function addItem() {
        addItemDialogVisible.value = true;
    }

    async function addItemSave(values) {
        let payload = Object.fromEntries(Object.entries(values.newObject.states).map(([key, obj]) => [key, obj.value]));
        payload.ETID = 1;

        try {
            let response = await api.post(mainPath, payload);

            items.value.push(response.data);

            await api.post('/users/refresh');

            toast.add(toastHandler('success', 'Dodano mapę', 'Pomyślnie dodano mapę'));
        } catch (error) {
            toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się dodać mapy', error));
        }

        addItemDialogVisible.value = false;
    }

    async function editItem(item) {
        if (!item) {
            toast.add(toastHandler('warn', 'Nie wybrano mapy', 'Wybierz mapę którą chcesz zmodyfikować'));
            return;
        }

        try {
            let response = await api.get(mainPath + '/' + item[mainKey]);

            initialValues.value = response.data;
            editItemDialogVisible.value = true;
        } catch (error) {
            toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych mapy', error));
        }
    }

    async function editItemSave(values) {
        let addPayload = values.add;
        let updatePayload = values.update;
        let deletePayload = values.delete;
        let map = values.update.find(item => item.ETID == 1);

        try {
            const addPromises = addPayload.map(element => api.post(mainPath, element));
            const updatePromises = updatePayload.map(element => api.put(mainPath + '/' + element.EID, element));
            const deletePromises = deletePayload.map(EID => api.delete(mainPath + '/' + EID));

            await Promise.all(addPromises);
            await Promise.all(updatePromises);
            await Promise.all(deletePromises);

            Object.assign(
                items.value.find(item => item.EID === map.EID),
                map
            );

            toast.add(toastHandler('success', 'Zmodyfikowano mapę', 'Pomyślnie zmodyfikowano mapę'));
        } catch (error) {
            toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się zmodyfikować mapy.', error));
        }

        editItemDialogVisible.value = false;
    }

    async function deleteItem(item) {
        if (!item) {
            toast.add(toastHandler('warn', 'Nie wybrano mapy', 'Wybierz mapę którą chcesz usunąć'));
            return;
        }

        try {
            let index = items.value.indexOf(item);

            await api.delete(mainPath + '/' + item[mainKey]);
            items.value.splice(index, 1);
            toast.add(toastHandler('success', 'Usunięto mapę', 'Pomyślnie usunięto mapę'));
        } catch (error) {
            toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się usunąć mapy.', error));
        }
    }

    async function showAdvancedObjectView(data) {
        try {
            let element = api.get(mainPath + '/' + data[mainKey]);

            showItem.value = (await element).data;
            advancedObjectViewVisible.value = true;
        } catch (error) {
            toast.add(toastHandler('error', 'Wystąpił problem', 'Nie udało się pobrać danych.', error));
        }
    }
</script>
