import { createApp } from 'vue';
import App from './App.vue';
import DocumentDialog from './components/DocumentDialog.vue';
import { provideConfig, setConfig, type DocgenConfig } from './config';
import './style.css';

// Экспортируем компоненты для использования в приложении
export { DocumentDialog };

// Функция установки для использования библиотеки как плагина Vue
export function install(app: any, options: Partial<DocgenConfig> = {}) {
    // Устанавливаем конфигурацию
    setConfig(options);

    // Предоставляем конфигурацию через провайдер
    provideConfig(app);

    // Регистрируем компоненты
    app.component('DocumentDialog', DocumentDialog);
}

export default {
    install
};

// Для локальной разработки и тестирования
const app = createApp(App);
// Устанавливаем плагин
app.use(install);
app.mount('#app');

console.log(`
888                             888            
888                             888            
888                             888            
888      .d88b.  .d8888b 8888b.888888 .d88b. 888d888 
888     d88""88bd88P"       "88b888   d88""88b888P"    
888     888  888888     .d888888888   888  888888     
888     Y88..88PY88b.   888  888Y88b. Y88..88P888     
88888888 "Y88P"  "Y8888P"Y888888 "Y888 "Y88P" 888     

 _____     _   _ _   _                 
|  __ \\   | | (_) | (_)                
| |__) |__| |_ _| |_ _  ___  _ __  ___ 
|  ___/ _ \\ __| | __| |/ _ \\| '_ \\/ __|
| |  |  __/ |_| | |_| | (_) | | | \\__ \\
|_|   \\___|\\__|_|\\__|_|\\___/|_| |_|___/
                                       
                                       

`);

console.log(`

    `);
