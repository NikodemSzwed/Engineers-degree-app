<template>
    <Form @submit="onFormSubmit" :resolver="globalResolver" :initial-values="props.initialValues"
        class="flex flex-col gap-4 w-full pt-1" fluid>
        <FormField v-for="(field, i) in props.fields" v-slot="$field" :name="field.name"
            :initialValue="field.initialValue" class="flex flex-col gap-1" :resolver="field.resolver">
            <FloatLabel variant="on" v-if="field.component !== 'custom'">
                <component :is="componentsMap[field.component]" :id="'on_label' + i" autocomplete="off" fluid
                    v-bind="field.componentOptions" :invalid="$field?.invalid">
                </component>

                <label :for="'on_label' + i">{{ field.label }}</label>
            </FloatLabel>
            <div v-else>
                <slot :name="'input-' + field.name" v-bind="{ field, $field }"></slot>
            </div>
            <Message v-if="$field?.invalid" v-for="err in $field?.errors" severity="error" size="small"
                variant="simple">
                {{ err.message }}
            </Message>
        </FormField>
        <Button type="submit" :label="props.submitLabel" />
    </Form>

</template>

<script setup>
import { ref } from 'vue';
import { Form } from '@primevue/forms';
import { FormField } from '@primevue/forms';
import { InputText, Button, FloatLabel, Password, Message, MultiSelect, Select, InputNumber, DatePicker } from 'primevue';

const componentsMap = {
    InputText,
    Password,
    MultiSelect,
    Select,
    InputNumber,
    DatePicker
};

const props = defineProps({
    fields: {
        type: Object,
        required: true,
    },
    initialValues: {
        type: Object,
        default: () => ({}),
    },
    globalResolverOverride: {
        type: Function,
        default: undefined,
    },
    submitLabel: {
        type: String,
        default: 'Zapisz',
    },
});

const emit = defineEmits(['submit']);

const globalResolver = ({ values }) => {
    if (props.globalResolverOverride) {
        return props.globalResolverOverride({ values });
    }

    const errors = {};

    for (const field of props.fields) {
        errors[field.name] = [];

        if (!field.conditions) continue;

        let maxLengthDefined = false;

        for (const condition of field.conditions) {
            if (!values[field.name] && values[field.name] != 0 && !field.optional) {
                errors[field.name].push({ message: condition.message });
                break;
            }

            if (condition.check == 'minlength' && values[field.name].length < condition.value) {
                errors[field.name].push({ message: condition.message });
            }
            else if (condition.check == 'maxlength' && values[field.name].length > condition.value) {
                maxLengthDefined = true;
                errors[field.name].push({ message: condition.message });
            }
            else if (condition.check == 'eqlength' && values[field.name].length != condition.value) {
                errors[field.name].push({ message: condition.message });
            }
            else if (condition.check == 'regex' && !values[field.name].match(new RegExp(condition.value))) {
                errors[field.name].push({ message: condition.message });
            }
            else if (condition.check == 'min' && values[field.name] < condition.value) {
                errors[field.name].push({ message: condition.message });
            }
            else if (condition.check == 'max' && values[field.name] > condition.value) {
                errors[field.name].push({ message: condition.message });
            }
            else if (condition.check == 'custom') {
                if (condition.function(values)) {
                    errors[field.name].push({ message: condition.message });
                }
            }
        }

        if (!maxLengthDefined && (field.component == 'InputText' || field.component == 'Password') && values[field.name] && values[field.name].length > 255) {
            errors[field.name].push({ message: 'Field must be at most 255 characters.' });
        }
    }

    return {
        errors
    };
};


function onFormSubmit(form) {
    if (form.valid) {
        emit('submit', {
            originalObject: props.initialValues,
            newObject: form
        });
    }

}
</script>