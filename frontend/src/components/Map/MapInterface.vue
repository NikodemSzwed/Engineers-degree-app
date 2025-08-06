<template>
    <div class="flex flex-1 flex-col xl:flex-row gap-1 xl:gap-3">
        <div class="flex-3 flex flex-col gap-1 lg:gap-3">
            <Card :pt="{ body: 'p-1 lg:p-5' }" v-if="upperBarVisible">
                <template #content>
                    <div class="flex flex-row justify-between">
                        <div class="flex items-center justify-center" :class="{ 'w-full': advancedViewAvailable }">
                            <span v-if="!editAvailable || mode.value == 'view'" class="font-bold text-lg">Mapa: {{ name
                            }}</span>
                            <div v-if="editAvailable && mode.value != 'view'"
                                class="w-full flex justify-between items-center">
                                <FloatLabel variant="on">
                                    <InputText v-model="name" id="on_label_name_edit" class="min-w-50"></InputText>
                                    <label :for="'on_label_name_edit'">Nazwa mapy</label>
                                </FloatLabel>
                                <Button @click="save">Zapisz</Button>
                            </div>
                        </div>
                        <FloatLabel variant="on" v-if="!advancedViewAvailable">
                            <MultiSelect :options="layers" v-model="choosenViewLayers" id="on_label_layers"
                                option-label="name" class="min-w-50"></MultiSelect>
                            <label :for="'on_label_layers'">Wyświetlane warstwy</label>
                        </FloatLabel>
                    </div>

                </template>
            </Card>
            <Card class="w-full flex flex-1" :pt="{ content: 'flex flex-1', body: 'flex flex-1 p-2' }">
                <template #content>
                    <Map :name="name" :mode="mode.value" :enable-snap="enableSnap"
                        :enable-simplify-geometry="enableSimplifyGeometry" :layers="layers"
                        :visible-layers="choosenViewLayers" :edit-layer="choosenEditLayer" ref="map"
                        v-model:selected="selected" v-model:search="search" :data="data" v-if="dataReady"></Map>
                </template>
            </Card>
        </div>

        <Card class="flex-1" v-if="advancedViewAvailable" :pt="{ body: 'flex flex-1', content: 'flex flex-1' }">
            <template #content>
                <div class="flex flex-1 flex-col">
                    <div class="flex flex-col gap-3">
                        <FloatLabel variant="on">
                            <MultiSelect fluid :options="layers" v-model="choosenViewLayers" id="on_label_layers"
                                option-label="name"></MultiSelect>
                            <label :for="'on_label_layers'">Wyświetlane warstwy</label>
                        </FloatLabel>
                        <FloatLabel variant="on" v-if="editAvailable">
                            <Select fluid :options="modes" v-model="mode" id="on_label_mode"
                                option-label="name"></Select>
                            <label :for="'on_label_mode'">Tryb</label>
                        </FloatLabel>



                        <FloatLabel variant="on" v-if="mode.value == 'view'">
                            <InputText fluid v-model="search" id="on_label_search"></InputText>
                            <label :for="'on_label_search'">Wyszukaj</label>
                        </FloatLabel>
                        <FloatLabel variant="on" v-if="mode.value != 'view'">
                            <Select fluid :options="layers" v-model="choosenEditLayer" id="on_label_chooseLayer"
                                option-label="name"></Select>
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
                            <Button fluid @click="setSelectedShapePointsToClosestExtentBorder">Przyciągnij punkty do
                                krawędzi</Button>
                        </div>
                        <div v-if="mode.value == 'modifyPolygon' || mode.value == 'modify'"
                            class="flex flex-row justify-between">
                            <Button fluid @click="copySelectedShape">Skopiuj element</Button>
                        </div>
                    </div>

                    <Divider></Divider>
                    <div class="flex flex-1 flex-col gap-3">
                        <span v-if="mode.value == 'draw'">Ostatni utworzony element</span>
                        <span v-else>Wybrany element</span>
                        <div class="flex flex-col gap-3" v-if="selected && mode.value != 'view'">
                            <FloatLabel variant="on">
                                <InputText fluid v-model="selected.customData.name" id="on_label_name"></InputText>
                                <label :for="'on_label_name'">Nazwa</label>
                            </FloatLabel>
                            <Button fluid @click="deleteSelectedShape">Usuń</Button>
                        </div>
                        <!-- <div v-if="showSelected && mode.value == 'view'" class="flex flex-1 flex-col gap-3"> -->

                        <div v-if="showSelected && mode.value == 'view'"
                            class="flex flex-col gap-3 bg-emphasis p-3 rounded-lg">
                            <span>Nazwa: {{ showSelected.name }}</span>
                        </div>
                        <div v-else class="w-full flex items-center justify-center text-sm text-surface-400">
                            <span v-if="mode.value == 'draw'">Dodaj element</span>
                            <span v-else>Wybierz element</span>
                        </div>
                        <div ref="parentManualHeightControl" class="flex flex-1 flex-col gap-3 overflow-hiddden">
                            <div v-if="showSelected && mode.value == 'view' && !calculatingParentHeight"
                                ref="child1ManualHeightControl" class="flex flex-col gap-3 overflow-y-auto">
                                <span v-if="showSelected.alerts.length > 0">Alerty:</span>
                                <div v-if="showSelected.alerts.length > 0" class="flex flex-col gap-2">
                                    <div class="bg-emphasis p-3 rounded-lg" v-for="alert in showSelected.alerts">
                                        <span>Nazwa: {{ alert.name }}</span>
                                    </div>
                                </div>
                            </div>

                            <div v-if="showSelected && mode.value == 'view' && !calculatingParentHeight"
                                ref="child2ManualHeightControl" class="flex flex-col gap-3 overflow-y-auto">
                                <span v-if="showSelected.orders.length > 0">Zlecenia na sektorze:</span>
                                <div v-if="showSelected.orders.length > 0" class="flex flex-col gap-2">
                                    <div class="bg-emphasis p-3 rounded-lg" v-for="order in showSelected.orders">
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
import Map from './Map.vue';
import { Card, FloatLabel, Select, MultiSelect, Divider, InputText, ToggleSwitch, Button } from 'primevue';

const props = defineProps({
    editAvailable: {
        type: Boolean,
        default: false
    },
    advancedViewAvailable: {
        type: Boolean,
        default: false
    },
    upperBarVisible: {
        type: Boolean,
        default: false
    },
    data: {
        type: Array,
        default: []
    }
});

const emit = defineEmits(['save']);

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

const selected = ref(null);
const showSelected = ref(null);
const search = ref(null);

const dataReady = ref(false);

const data = ref({});

const modes = [
    {
        name: 'Przegląd',
        value: 'view'
    },
    {
        name: 'Dodawanie',
        value: 'draw'
    },
    {
        name: 'Edycja',
        value: 'modify'
    },
    {
        name: 'Edycja zaawansowana',
        value: 'modifyPolygon'
    }
];
const mode = ref(modes[0]);

const layers = [
    {
        name: "Strefy",
        value: 'zones',
        interactions: ['draw', 'modify', 'transform', 'snap']
    },
    {
        name: "Fizyczne sektory",
        value: 'physical',
        interactions: ['draw', 'modify', 'transform', 'snap']
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
    selected.value = null;
}

function copySelectedShape() {
    map.value?.copySelectedShape();
}

function save() {
    const features = map.value?.getAllFeatures();

    const operationData = {
        add: [],
        update: [],
        delete: []
    }

    if (features) {
        const mapData = sourceData.value.find((l) => l.ETID === 1);

        operationData.add = features.features.physical
            .filter((f) => f.customData.EID === null)
            .map((f) => {
                f.customData.ETID = 3;
                f.customData.ParentEID = mapData.EID;
                f.customData.DimensionsAndStructure_json = JSON.stringify(f.getGeometry().getCoordinates());
                delete f.customData.alerts;
                delete f.customData.orders;

                return f.customData;
            });
        operationData.update = features.features.physical
            .filter((f) => f.customData.EID !== null)
            .map((f) => {
                f.customData.DimensionsAndStructure_json = JSON.stringify(f.getGeometry().getCoordinates());
                delete f.customData.alerts;
                delete f.customData.orders;

                return f.customData;
            });
        operationData.update.push({
            EID: mapData.EID,
            name: name.value,
            ETID: 1,
            DimensionsAndStructure_json: JSON.stringify(
                {
                    zones: features.features.zones
                        .map((f) => {
                            return {
                                name: f.customData.name,
                                coords: f.getGeometry().getCoordinates()
                            }
                        })
                }
            )
        });

        operationData.delete = features.deletedFeatures.map((f) => f.customData.EID);
    }

    emit('save', operationData);
}


watch(selected, (value) => {
    showSelected.value = value?.customData;
})

watch(child1ManualHeightControl, (value) => {
    bindMaxSizeToParent(value);
})

watch(child2ManualHeightControl, (value) => {
    bindMaxSizeToParent(value, child1ManualHeightControl.value);
})

watch(parentManualHeightControl, (value) => {
    settingParentHeight();
})

onMounted(() => {
    const mapData = sourceData.value.find((l) => l.ETID === 1);
    if (mapData) {
        name.value = mapData.name;
        data.value.zones = JSON.parse(mapData.DimensionsAndStructure_json).zones || [];
    }

    data.value.physical = sourceData.value.filter((l) => l.ETID === 3);
    data.value.physical.forEach((p) => {
        p.orders = sourceData.value.filter((l) => l.ETID === 2 && l.ParentEID === p.EID);
        p.alerts = [...(p.alerts || []), ...p.orders.map((o) => o.alerts || []).flat()];
        console.log("🚀 ~ p.alerts:", p.alerts)

    })

    dataReady.value = true;
})

function bindMaxSizeToParent(childElement, otherChild = null) {
    const parent = childElement?.parentElement;
    if (!parent) return;

    let otherChildHeight = 0;
    if (otherChild) {
        otherChildHeight = otherChild.getBoundingClientRect().height;
    }

    const resize = () => {
        const parentRect = parent.getBoundingClientRect();
        childElement.style.maxHeight = `${otherChild ? parentHeight.value / 2 - 40 + (parentHeight.value / 2 - otherChildHeight) : parentHeight.value / 2 - 20}px`;
        childElement.style.maxWidth = `${parentRect.width}px`;
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(parent);

    return () => observer.disconnect();
}

function settingParentHeight() {
    calculatingParentHeight.value = true;
    setTimeout(() => {
        parentHeight.value = parentManualHeightControl.value.getBoundingClientRect().height;
        calculatingParentHeight.value = false;
    }, 100);
}
</script>
