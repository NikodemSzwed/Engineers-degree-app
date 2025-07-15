<template>
    <Form @submit="onFormSubmit" :resolver="globalResolver" :initial-values="props.initialValues"
        class="flex flex-col gap-4 w-full pt-1" fluid>
        <FormField v-for="(field, i) in props.fields" v-slot="$field" :name="field.name"
            :initialValue="field.initialValue" class="flex flex-col gap-1" :resolver="field.resolver">
            <div v-if="field.component == 'PickList'">
                <div class="ml-3 mb-2">{{ field.label }}</div>
                {{ $field.props }} -
                {{ $field }}
                <component v-model="$field.value" :is="componentsMap[field.component]" autocomplete="off" fluid
                    v-bind="$field.props" :invalid="$field?.invalid">
                    <!-- v-bind="field.componentOptions" -->
                </component>
            </div>


            <FloatLabel v-else variant="on">
                <component :is="componentsMap[field.component]" :id="'on_label' + i" autocomplete="off" fluid
                    v-bind="field.componentOptions" :invalid="$field?.invalid">
                </component>

                <label :for="'on_label' + i">{{ field.label }}</label>
            </FloatLabel>
            <Message v-if="$field?.invalid" v-for="err in $field?.errors" severity="error" size="small"
                variant="simple">
                {{ err.message }}
            </Message>
        </FormField>
        <Button type="submit" severity="secondary" label="Zapisz" />
    </Form>

</template>

<script setup>
import { ref } from 'vue';
import { Form } from '@primevue/forms';
import { FormField } from '@primevue/forms';
import { InputText, Button, FloatLabel, Password, Message, PickList } from 'primevue';

const componentsMap = {
    InputText,
    Password,
    PickList
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
    }
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
            if (!values[field.name] && !field.optional) {
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
    // if (form.valid) {
    emit('submit', {
        originalObject: props.initialValues,
        newObject: form
    });
    // }

}
</script>