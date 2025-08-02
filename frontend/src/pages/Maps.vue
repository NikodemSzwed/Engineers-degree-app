<template>
    <div class="flex flex-1 flex-col xl:flex-row gap-3">
        <div class="flex-3 flex flex-col gap-3">
            <Card>
                <template #content>
                    <div class="flex flex-row justify-between">
                        <div class="flex items-center justify-center" :class="{ 'w-full': editAvailable }">
                            <span class="font-bold text-lg">Mapa: {{ name }}</span>
                        </div>
                        <FloatLabel variant="on" v-if="!editAvailable">
                            <MultiSelect :options="layers" v-model="choosenViewLayers" id="on_label_layers"
                                option-label="name"></MultiSelect>
                            <label :for="'on_label_layers'">Wyświetlane warstwy</label>
                        </FloatLabel>
                    </div>

                </template>
            </Card>
            <Map class=" min-h-[50vh]" :name="name" :mode="mode.value" :enable-snap="enableSnap"
                :enable-simplify-geometry="enableSimplifyGeometry" :layers="layers" :visible-layers="choosenViewLayers"
                :edit-layer="choosenEditLayer" ref="map" v-model:selected="selected"></Map>
        </div>

        <Card class="flex-1" v-if="editAvailable">
            <template #content>
                <div class="flex flex-col">
                    <div class="flex flex-col gap-3">
                        <FloatLabel variant="on">
                            <MultiSelect fluid :options="layers" v-model="choosenViewLayers" id="on_label_layers"
                                option-label="name"></MultiSelect>
                            <label :for="'on_label_layers'">Wyświetlane warstwy</label>
                        </FloatLabel>
                        <FloatLabel variant="on">
                            <Select fluid :options="modes" v-model="mode" id="on_label_mode"
                                option-label="name"></Select>
                            <label :for="'on_label_mode'">Tryb</label>
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
                    </div>

                    <Divider></Divider>
                    <div class="flex flex-col gap-3">
                        <span v-if="mode.value == 'draw'">Ostatni utworzony element</span>
                        <span v-else-if="mode.value == 'modify' || mode.value == 'modifyPolygon'">Wybrany element</span>
                        <div class="flex flex-col gap-3" v-if="selected">
                            <FloatLabel variant="on" v-if="mode.value != 'view'">
                                <InputText fluid v-model="selected.customData.name" id="on_label_name"></InputText>
                                <label :for="'on_label_name'">Nazwa</label>
                            </FloatLabel>
                            <Button fluid @click="deleteSelectedShape" v-if="mode.value != 'view'">Usuń</Button>
                        </div>
                        <div v-else class="w-full flex items-center justify-center text-sm text-surface-400">
                            <span v-if="mode.value == 'draw'">Dodaj element</span>
                            <span v-else-if="mode.value == 'modify' || mode.value == 'modifyPolygon'">Wybierz
                                element</span>
                        </div>

                    </div>
                </div>

            </template>
        </Card>
    </div>

</template>

<script setup>
import { ref } from 'vue';
import Map from '../components/Map/Map.vue';
import { Card, FloatLabel, Select, MultiSelect, Divider, InputText, ToggleSwitch, Button } from 'primevue';

const editAvailable = ref(true);

const map = ref();

const name = ref('Hala 9');

const selected = ref(null);

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
        name: "Fizyczne sektory",
        value: 'physical',
        interactions: ['draw', 'modify', 'modifyPolygon']
    },
    {
        name: "Strefy",
        value: 'zones',
        interactions: ['draw', 'modify', 'modifyPolygon']
    }
];
const choosenViewLayers = ref([...layers]);
const choosenEditLayer = ref(layers[0]);

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
</script>
