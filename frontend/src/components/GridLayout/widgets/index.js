import { defineAsyncComponent } from 'vue';

const componentModules = import.meta.glob('@/components/GridLayout/widgets/*.vue');
const metaModules = import.meta.glob('@/components/GridLayout/widgets/*.vue', {
    eager: true,
    import: 'widgetMeta',
});

export const widgets = {};
export const widgetsMeta = {};

for (const path in componentModules) {
    const name = path.split('/').pop().replace('.vue', '');
    widgets[name] = defineAsyncComponent(componentModules[path]);
}

for (const path in metaModules) {
    const name = path.split('/').pop().replace('.vue', '');
    widgetsMeta[name] = metaModules[path] || { minW: 1, minH: 1 };
}

export default { widgets, widgetsMeta };
