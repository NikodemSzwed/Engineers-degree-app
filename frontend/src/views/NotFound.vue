<template>
    <div class="relative flex h-screen w-screen flex-col items-center justify-center">
        <div class="flex flex-1 flex-col items-center justify-center gap-4">
            <div class="flex items-center pt-8 sm:justify-start">
                <div class="border-r px-4 text-2xl tracking-wider">404
                </div>

                <div class="ml-4 text-2xl tracking-wider uppercase">Not Found</div>
            </div>
            <RouterLink to="/"> <Button>Wróć do strony głównej</Button> </RouterLink>
        </div>

        <footer class="text-surface-300 p-3 text-center text-sm">
            &copy; {{ new Date().getFullYear() }} Warehouse Logistics - Nikodem Szwed.
        </footer>
    </div>
</template>

<script setup>
import Button from 'primevue/button';
</script>
