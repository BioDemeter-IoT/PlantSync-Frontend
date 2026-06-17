import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router/index';
import './style.css';

import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';

import ConfirmationService from 'primevue/confirmationservice';
import DialogService from 'primevue/dialogservice';
import ToastService from 'primevue/toastservice';

import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import ConfirmDialog from 'primevue/confirmdialog';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Menu from 'primevue/menu';
import Tag from 'primevue/tag';
import Textarea from 'primevue/textarea';
import Toolbar from 'primevue/toolbar';
import Toast from 'primevue/toast';
import Avatar from 'primevue/avatar';
import DatePicker from 'primevue/datepicker';
import Divider from 'primevue/divider';
import Select from 'primevue/select';
import ToggleSwitch from 'primevue/toggleswitch';

const app = createApp(App);

// Pinia
const pinia = createPinia();
app.use(pinia);

// PrimeVue
app.use(PrimeVue, {
  ripple: true,
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      cssLayer: false,
      darkModeSelector: '[data-theme="dark"]',
    },
  },
});

app.use(ConfirmationService);
app.use(DialogService);
app.use(ToastService);

// Vue Router
app.use(router);

// Global PrimeVue components
app.component('pv-button', Button);
app.component('pv-card', Card);
app.component('pv-column', Column);
app.component('pv-confirm-dialog', ConfirmDialog);
app.component('pv-data-table', DataTable);
app.component('pv-dialog', Dialog);
app.component('pv-float-label', FloatLabel);
app.component('pv-input-text', InputText);
app.component('pv-input-number', InputNumber);
app.component('pv-menu', Menu);
app.component('pv-tag', Tag);
app.component('pv-textarea', Textarea);
app.component('pv-toolbar', Toolbar);
app.component('pv-toast', Toast);
app.component('pv-avatar', Avatar);
app.component('pv-datepicker', DatePicker);
app.component('pv-divider', Divider);
app.component('pv-select', Select);
app.component('pv-toggle-switch', ToggleSwitch);

app.mount('#app');
