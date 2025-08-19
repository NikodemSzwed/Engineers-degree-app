<template>
    <div class="flex flex-1 flex-col gap-1 select-none xl:flex-row xl:gap-3">
        <div class="flex flex-3 flex-col gap-1 lg:gap-3">
            <Card :pt="{ body: 'p-1 lg:p-5' }" v-if="upperBarVisible">
                <template #content>
                    <div class="flex flex-row justify-between">
                        <div class="flex items-center justify-center" :class="{ 'w-full': advancedViewAvailable }">
                            <span v-if="!editAvailable || mode.value == 'view'" class="text-lg font-bold"
                                >Mapa: {{ name }}</span
                            >
                            <div
                                v-if="editAvailable && mode.value != 'view'"
                                class="flex w-full items-center justify-between"
                            >
                                <FloatLabel variant="on">
                                    <InputText v-model="name" id="on_label_name_edit" class="min-w-50"></InputText>
                                    <label :for="'on_label_name_edit'">Nazwa mapy</label>
                                </FloatLabel>
                                <Button @click="save">Zapisz</Button>
                            </div>
                        </div>
                        <FloatLabel variant="on" v-if="!advancedViewAvailable">
                            <MultiSelect
                                :options="layers"
                                v-model="choosenViewLayers"
                                id="on_label_layers"
                                option-label="name"
                                class="min-w-50"
                            ></MultiSelect>
                            <label :for="'on_label_layers'">Wyświetlane warstwy</label>
                        </FloatLabel>
                    </div>
                </template>
            </Card>
            <Card class="flex min-h-[30vh] w-full flex-1" :pt="{ content: 'flex flex-1', body: 'flex flex-1 p-2' }">
                <template #content>
                    <MyMap
                        :name="name"
                        :mode="mode.value"
                        :enable-snap="enableSnap"
                        :enable-simplify-geometry="enableSimplifyGeometry"
                        :layers="layers"
                        :visible-layers="choosenViewLayers"
                        :edit-layer="choosenEditLayer"
                        ref="map"
                        v-model:selected="value"
                        v-model:search="search"
                        v-model:data="dataTransformed"
                        v-if="dataReady"
                    ></MyMap>
                </template>
            </Card>
        </div>

        <Card class="flex-1" v-if="advancedViewAvailable" :pt="{ body: 'flex flex-1', content: 'flex flex-1' }">
            <template #content>
                <div class="flex flex-1 flex-col">
                    <div class="flex flex-col gap-3">
                        <FloatLabel variant="on">
                            <MultiSelect
                                fluid
                                :options="layers"
                                v-model="choosenViewLayers"
                                id="on_label_layers"
                                option-label="name"
                            ></MultiSelect>
                            <label :for="'on_label_layers'">Wyświetlane warstwy</label>
                        </FloatLabel>
                        <FloatLabel variant="on" v-if="editAvailable">
                            <Select
                                fluid
                                :options="modes"
                                v-model="mode"
                                id="on_label_mode"
                                option-label="name"
                            ></Select>
                            <label :for="'on_label_mode'">Tryb</label>
                        </FloatLabel>

                        <FloatLabel variant="on" v-if="mode.value == 'view'">
                            <InputText fluid v-model="search" id="on_label_search"></InputText>
                            <label :for="'on_label_search'">Wyszukaj po sektorze lub zleceniu</label>
                        </FloatLabel>
                        <FloatLabel variant="on" v-if="mode.value != 'view'">
                            <Select
                                fluid
                                :options="layers"
                                v-model="choosenEditLayer"
                                id="on_label_chooseLayer"
                                option-label="name"
                            ></Select>
                            <label :for="'on_label_chooseLayer'">Edytowana warstwa</label>
                        </FloatLabel>

                        <div v-if="mode.value != 'view'" class="flex flex-row justify-between">
                            <span>Przyciągaj element</span>
                            <ToggleSwitch v-model="enableSnap"></ToggleSwitch>
                        </div>
                        <div v-if="mode.value == 'modifyPolygon'" class="flex flex-row justify-between">
                            <span>Upraszczaj geometrię</span>
                            <ToggleSwitch v-model="enableSimplifyGeometry"></ToggleSwitch>
                        </div>
                        <div v-if="mode.value == 'modifyPolygon'" class="flex flex-row justify-between">
                            <Button fluid @click="setSelectedShapeToRectangle">Przywróć kształt do prostokąta</Button>
                        </div>
                        <div v-if="mode.value == 'modifyPolygon'" class="flex flex-row justify-between">
                            <Button fluid @click="setSelectedShapePointsToClosestExtentBorder"
                                >Przyciągnij punkty do krawędzi</Button
                            >
                        </div>
                        <div
                            v-if="mode.value == 'modifyPolygon' || mode.value == 'modify'"
                            class="flex flex-row justify-between"
                        >
                            <Button fluid @click="copySelectedShape">Skopiuj element</Button>
                        </div>
                    </div>

                    <Divider></Divider>
                    <div class="flex flex-1 flex-col gap-3">
                        <span v-if="mode.value == 'draw'">Ostatni utworzony element</span>
                        <span v-else>Wybrany element</span>
                        <div class="flex flex-col gap-3" v-if="showSelected && mode.value != 'view'">
                            <FloatLabel variant="on">
                                <InputText fluid v-model="showSelected.name" id="on_label_name"></InputText>
                                <label :for="'on_label_name'">Nazwa</label>
                            </FloatLabel>
                            <Button fluid @click="deleteSelectedShape">Usuń</Button>
                        </div>
                        <!-- <div v-if="showSelected && mode.value == 'view'" class="flex flex-1 flex-col gap-3"> -->

                        <div
                            v-else-if="showSelected && mode.value == 'view'"
                            class="bg-emphasis flex flex-col gap-3 rounded-lg p-3"
                        >
                            <span>Nazwa: {{ showSelected.name }}</span>
                        </div>
                        <div v-else class="text-surface-400 flex w-full items-center justify-center text-sm">
                            <span v-if="mode.value == 'draw'">Dodaj element</span>
                            <span v-else>Wybierz element</span>
                        </div>
                        <div ref="parentManualHeightControl" class="overflow-hiddden flex flex-1 flex-col gap-3">
                            <div
                                v-if="
                                    showSelected &&
                                    mode.value == 'view' &&
                                    !calculatingParentHeight &&
                                    showSelected.alerts.length > 0
                                "
                                ref="child1ManualHeightControl"
                                class="flex flex-1 flex-col gap-3 overflow-y-auto"
                            >
                                <span>Alerty:</span>
                                <div class="flex flex-col gap-2">
                                    <div
                                        class="bg-emphasis flex flex-col gap-3 rounded-lg p-3"
                                        v-for="alert in showSelected.alerts"
                                    >
                                        <span>{{ alert.AAName }}</span>
                                        <span>Dotyczy: {{ alert.EIDName }}</span>
                                        <span>Zgłoszono: {{ formatDate(alert.date, 'dd.MM.yyyy HH:mm') }}</span>
                                        <span
                                            >Stan:
                                            <Tag
                                                :severity="getSeverity(alert.State)"
                                                :value="getAlertMessage(alert.State)"
                                            ></Tag>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div
                                v-if="
                                    showSelected &&
                                    mode.value == 'view' &&
                                    !calculatingParentHeight &&
                                    showSelected.orders.length > 0
                                "
                                ref="child2ManualHeightControl"
                                class="flex flex-1 flex-col gap-3 overflow-y-auto"
                            >
                                <span>Zlecenia na sektorze:</span>
                                <div class="flex flex-col gap-2">
                                    <div class="bg-emphasis rounded-lg p-3" v-for="order in showSelected.orders">
                                        <span>Nazwa: {{ order.name }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>

<script setup>
    import { onMounted, ref, watch, computed } from 'vue';
    import MyMap from './Map.vue';
    import { Card, FloatLabel, Select, MultiSelect, Divider, InputText, ToggleSwitch, Button, Tag } from 'primevue';
    import { format } from 'date-fns';

    const props = defineProps({
        editAvailable: {
            type: Boolean,
            default: false,
        },
        advancedViewAvailable: {
            type: Boolean,
            default: false,
        },
        upperBarVisible: {
            type: Boolean,
            default: false,
        },
        data: {
            type: Array,
            default: [],
        },
        value: {
            type: Object,
            default: null,
        },
        id: String,
        name: String,
    });

    const value = computed({
        get: () => props.value,
        set(value) {
            if (!value) {
                value = null;
            }
            showSelected.value = value?.customData;
            if (!advancedViewAvailable.value) {
                let data = value?.customData ? JSON.parse(JSON.stringify(value?.customData)) : null;
                if (data) emit('selected', data);
                else emit('deselected');
            }
            emit('update:value', value);
            emit('change');
        },
    });

    const emit = defineEmits(['save', 'selected', 'deselected', 'update:value', 'change']);

    defineExpose({
        clearSelect,
        fitMapToContainer,
        getMapEID,
        setMapData,
        setSelect,
    });

    const editAvailable = computed(() => props.editAvailable);
    const advancedViewAvailable = computed(() => props.advancedViewAvailable);
    const upperBarVisible = computed(() => props.upperBarVisible);
    const sourceData = computed(() => props.data);

    const map = ref();
    const child1ManualHeightControl = ref();
    const child2ManualHeightControl = ref();
    const parentManualHeightControl = ref();
    const parentHeight = ref(0);
    const calculatingParentHeight = ref(true);

    const name = ref();

    // const selected = ref(null);
    const showSelected = ref(null);
    const search = ref(null);

    const dataReady = ref(false);

    const dataTransformed = ref({});

    const modes = [
        {
            name: 'Przegląd',
            value: 'view',
        },
        {
            name: 'Dodawanie',
            value: 'draw',
        },
        {
            name: 'Edycja',
            value: 'modify',
        },
        {
            name: 'Edycja zaawansowana',
            value: 'modifyPolygon',
        },
    ];
    const mode = ref(modes[0]);

    const layers = [
        {
            name: 'Strefy',
            value: 'zones',
            interactions: ['draw', 'modify', 'transform', 'snap'],
        },
        {
            name: 'Fizyczne sektory',
            value: 'physical',
            interactions: ['draw', 'modify', 'transform', 'snap'],
        },
    ];
    const choosenViewLayers = ref([...layers]);
    const choosenEditLayer = ref(layers[1]);

    const enableSnap = ref(true);
    const enableSimplifyGeometry = ref(true);

    function setSelectedShapeToRectangle() {
        map.value?.setSelectedShapeToRectangle();
    }

    function setSelectedShapePointsToClosestExtentBorder() {
        map.value?.setSelectedShapePointsToClosestExtentBorder();
    }

    function deleteSelectedShape() {
        map.value?.deleteSelectedShape();
        value.value = null;
    }

    function copySelectedShape() {
        map.value?.copySelectedShape();
    }

    function clearSelect() {
        map.value?.clearSelect();
    }

    function fitMapToContainer() {
        map.value?.fitToContainer();
    }

    function setSelect(EID) {
        return map.value?.setSelect(EID);
    }

    function getMapEID() {
        const mapData = sourceData.value.find(l => l.ETID === 1);
        return mapData.EID;
    }

    function save() {
        const features = map.value?.getAllFeatures();

        const operationData = {
            add: [],
            update: [],
            delete: [],
        };

        if (features) {
            const mapData = sourceData.value.find(l => l.ETID === 1);

            operationData.add = features.features.physical
                .filter(f => f.customData.EID === null)
                .map(f => {
                    f.customData.ETID = 3;
                    f.customData.ParentEID = mapData.EID;
                    f.customData.DimensionsAndStructure_json = JSON.stringify(f.getGeometry().getCoordinates());
                    delete f.customData.alerts;
                    delete f.customData.orders;

                    return JSON.parse(JSON.stringify(f.customData));
                });
            operationData.update = features.features.physical
                .filter(f => f.customData.EID !== null)
                .map(f => {
                    f.customData.DimensionsAndStructure_json = JSON.stringify(f.getGeometry().getCoordinates());
                    delete f.customData.alerts;
                    delete f.customData.orders;

                    return JSON.parse(JSON.stringify(f.customData));
                });
            operationData.update.push({
                EID: mapData.EID,
                name: name.value,
                ETID: 1,
                DimensionsAndStructure_json: JSON.stringify({
                    zones: features.features.zones.map(f => {
                        return JSON.parse(
                            JSON.stringify({
                                name: f.customData.name,
                                coords: f.getGeometry().getCoordinates(),
                            })
                        );
                    }),
                }),
            });

            operationData.delete = features.deletedFeatures.filter(f => f.customData.EID).map(f => f.customData.EID);
        }

        emit('save', operationData);
    }

    watch(parentManualHeightControl, value => {
        settingParentHeight();
    });

    watch(sourceData, () => {
        setMapData();
    });

    onMounted(() => {
        setMapData();
        dataReady.value = true;
    });

    function setMapData() {
        const mapData = sourceData.value.find(l => l.ETID === 1);
        if (mapData) {
            name.value = mapData.name;
            dataTransformed.value.zones = JSON.parse(mapData.DimensionsAndStructure_json).zones || [];
        }

        dataTransformed.value.physical = sourceData.value.filter(l => l.ETID === 3);
        dataTransformed.value.physical.forEach(p => {
            p.orders = sourceData.value.filter(l => l.ETID === 2 && l.ParentEID === p.EID);
            p.alerts = [
                ...new Map(
                    [...(p.alerts || []), ...p.orders.flatMap(o => o.alerts || [])].map(a => [a.AID, a])
                ).values(),
            ];
        });

        dataTransformed.value = dataTransformed.value;
    }

    async function settingParentHeight() {
        calculatingParentHeight.value = true;

        await new Promise(resolve => setTimeout(resolve, 300));
        parentHeight.value = parentManualHeightControl.value.getBoundingClientRect().height - 30;
        parentManualHeightControl.value.style.maxHeight = `${parentHeight.value}px`;
        calculatingParentHeight.value = false;
    }

    function formatDate(date, fmt = 'dd.MM.yyyy') {
        return format(new Date(date), fmt);
    }

    function getSeverity(state) {
        switch (state) {
            case 0:
                return 'danger';
            case 1:
                return 'warn';
            case 2:
                return 'success';
            default:
                return 'info';
        }
    }

    function getAlertMessage(state) {
        switch (state) {
            case 0:
                return 'Nowy';
            case 1:
                return 'W trakcie rozwiązywania';
            case 2:
                return 'Rozwiązany';
            default:
                return 'Inny';
        }
    }
</script>
