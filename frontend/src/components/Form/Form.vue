<template>
    <Form @submit="onFormSubmit" :resolver="globalResolver" :initial-values="initialValues"
        class="flex flex-col gap-4 w-full pt-1" fluid>
        <FormField v-for="(field, i) in fields" v-slot="$field" :name="field.name" :initialValue="field.initialValue"
            class="flex flex-col gap-1" :resolver="field.resolver">
            <FloatLabel variant="on">
                <component :is="componentsMap[field.component]" :id="'on_label' + i" autocomplete="off" fluid
                    v-bind="field.componentOptions">
                </component>

                <label :for="'on_label' + i">{{ field.label }}</label>
            </FloatLabel>
            <Message v-if="$field?.invalid" v-for="err in $field?.errors" severity="error" size="small"
                variant="simple">
                {{ err.message }}
                <!-- {{ $field.error?.message }} -->
            </Message>
        </FormField>
        <Button type="submit" severity="secondary" label="Zapisz" />
    </Form>

</template>

<script setup>
import { ref } from 'vue';
import { Form } from '@primevue/forms';
import { FormField } from '@primevue/forms';
import { InputText, Button, FloatLabel, Password, Message } from 'primevue';

const componentsMap = {
    InputText,
    Button,
    Password,
};

const customPasswordResolver = ({ value }) => {
    const errors = [];
    console.log("🚀 ~ customPasswordResolver ~ value:", value)
    if (!value) {
        errors.push({ message: 'Password is required via Custom.' });
        errors.push({ message: 'Password is required via Custom2.' });
    }

    return {
        errors
    };
};
const globalResolver = ({ values }) => {
    console.log("🚀 ~ globalResolver ~ values:", values)
    const errors = {
        password: [],
        passwordRepeat: []
    };
    if (!values.password) {
        errors.password.push({ message: 'Password is required via Global.' });
    }

    if (values.password.length < 8) {
        errors.password.push({ message: 'Password must be at least 8 characters.' });
    }
    if (values.password.length > 20) {
        errors.password.push({ message: 'Password must be at most 20 characters.' });
    }


    if (values.password !== values.passwordRepeat) {
        errors.passwordRepeat.push({ message: 'Passwords do not match.' });
    }

    return {
        errors
    };
};



const fields = ref([
    {
        name: 'login',
        // initialValue: '',
        label: 'Login',
        component: 'InputText',
        componentOptions: {
            type: 'text',
        }
    },
    {
        name: 'email',
        // initialValue: 'asd@wp.pl',
        label: 'Email',
        component: 'InputText',
        componentOptions: {
            type: 'text',
        }
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
            feedback: false
        }
    },
]);

const initialValues = ref({
    login: 'dame',
    email: 'asd2@wp.pl',
    password: '123',
    passwordRepeat: '123',
});
// fields.value.reduce((acc, field) => {
//     acc[field.name] = field.initialValue;
//     return acc;
// }, {});


function onFormSubmit(values) {
    console.log(values);
}
</script>