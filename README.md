<p align="center">
    <img src="https://github.com/LT-Devs/locator-front-docgen-lib/blob/master/banner.svg?raw=true" alt="Locator DocGen" height="150" />
</p>
<h3 align="center">Locator модуль для обращений граждан</h3>

## Обзор

Библиотека для генерации документов в системе Locator. Позволяет создавать и настраивать шаблоны документов с динамическими полями и интеграцией с API.

## Структура шаблона документа

Шаблоны документов (`DocumentTemplate`) используются для генерации документов и имеют следующую структуру:

```typescript
interface DocumentTemplate {
  id: string; // Уникальный идентификатор шаблона
  name: string; // Название шаблона
  description: string; // Описание шаблона
  api_endpoints?: ApiEndpoint[]; // Опциональные API эндпоинты для получения дополнительных данных
  additional_fields: AdditionalField[]; // Дополнительные поля для ввода пользователем
}
```

### Дополнительные поля (AdditionalField)

Дополнительные поля позволяют пользователю вводить данные, которые будут использованы при генерации документа:

```typescript
interface AdditionalField {
  id: string; // Уникальный идентификатор поля
  name: string; // Название поля
  type: "string" | "number" | "date" | "boolean"; // Тип данных
  description: string; // Описание поля
  required: boolean; // Является ли поле обязательным
  defaultValue: string | number | boolean | null; // Значение по умолчанию
  conditions?: (FieldCondition | ConditionGroup)[]; // Условия отображения поля
}
```

### Типы данных полей

- `string` - текстовое поле
- `number` - числовое поле
- `date` - поле для ввода даты (в формате YYYY-MM-DD)
- `boolean` - логическое поле (чекбокс)

### Условия отображения полей (Conditions)

Условия определяют, когда поле должно отображаться. Поддерживаются как простые условия, так и группы условий с логическими операторами.

#### Простое условие (FieldCondition)

```typescript
interface FieldCondition {
  field: string; // Путь к полю в объекте документа
  operator: string; // Оператор сравнения
  value: string | number | boolean | null; // Значение для сравнения
}
```

#### Операторы сравнения

- `==` - равно
- `!=` - не равно
- `>` - больше
- `<` - меньше
- `>=` - больше или равно
- `<=` - меньше или равно
- `includes` - массив содержит значение
- `!includes` - массив не содержит значение
- `regex` - соответствует регулярному выражению
- `!regex` - не соответствует регулярному выражению

#### Группировка условий (ConditionGroup)

```typescript
interface ConditionGroup {
  logic: "AND" | "OR"; // Логический оператор для группы
  conditions: (FieldCondition | ConditionGroup)[]; // Массив условий или групп условий
}
```

### Примеры условий

1. Простое условие (показать поле, если тип документа - "Заявление"):

```json
{
  "field": "type",
  "operator": "==",
  "value": "Заявление"
}
```

2. Группа условий с логикой AND:

```json
{
  "logic": "AND",
  "conditions": [
    {
      "field": "type",
      "operator": "==",
      "value": "Заявление"
    },
    {
      "field": "status",
      "operator": "!=",
      "value": "Закрыто"
    }
  ]
}
```

3. Вложенные группы условий:

```json
{
  "logic": "OR",
  "conditions": [
    {
      "logic": "AND",
      "conditions": [
        {
          "field": "type",
          "operator": "==",
          "value": "Заявление"
        },
        {
          "field": "priority",
          "operator": ">",
          "value": 3
        }
      ]
    },
    {
      "field": "status",
      "operator": "==",
      "value": "Срочно"
    }
  ]
}
```

## API Интеграция

Шаблоны документов могут включать интеграцию с API для получения дополнительных данных:

```typescript
interface ApiEndpoint {
  id: string; // Уникальный идентификатор эндпоинта (используется для доступа к данным)
  url: string; // URL эндпоинта (поддерживает шаблонные переменные)
  method: "GET" | "POST" | "PUT" | "DELETE"; // HTTP метод
  params?: Record<string, any>; // Параметры запроса (опционально)
  body?: Record<string, any>; // Тело запроса (опционально)
  headers?: Record<string, string>; // Заголовки запроса (опционально)
}
```

### Шаблонные переменные в URL и параметрах

В URL и параметрах можно использовать шаблонные переменные в формате `{{path.to.value}}`. Эти переменные будут заменены соответствующими значениями из документа:

- `{{document.ref_id}}` - ID документа
- `{{document.type}}` - тип документа
- Любые другие поля из объекта документа

### Доступ к базовым URL из конфигурации

Вы можете использовать базовые URL из конфигурации приложения:

- `{config.backendUrl}/api/endpoint` - основной бэкенд URL
- `{config.staffUrl}/api/endpoint` - URL для API персонала
- `{config.inquiryUrl}/api/endpoint` - URL для API обращений

## Пример полного шаблона документа

```json
{
  "id": "petition_response",
  "name": "Ответ на обращение",
  "description": "Генерирует документ с ответом на обращение гражданина",
  "api_endpoints": [
    {
      "id": "petitionData",
      "url": "{config.inquiryUrl}/api/petitions/{{document.ref_id}}",
      "method": "GET"
    },
    {
      "id": "userData",
      "url": "{config.staffUrl}/api/users/{{document.author_id}}",
      "method": "GET"
    }
  ],
  "additional_fields": [
    {
      "id": "response_type",
      "name": "Тип ответа",
      "type": "string",
      "description": "Выберите тип ответа на обращение",
      "required": true,
      "defaultValue": "Стандартный"
    },
    {
      "id": "response_date",
      "name": "Дата ответа",
      "type": "date",
      "description": "Укажите дату ответа",
      "required": true,
      "defaultValue": null
    },
    {
      "id": "include_attachments",
      "name": "Включить приложения",
      "type": "boolean",
      "description": "Включить список приложений в документ",
      "required": false,
      "defaultValue": true,
      "conditions": [
        {
          "field": "has_attachments",
          "operator": "==",
          "value": true
        }
      ]
    },
    {
      "id": "rejection_reason",
      "name": "Причина отказа",
      "type": "string",
      "description": "Укажите причину отказа по обращению",
      "required": true,
      "defaultValue": null,
      "conditions": [
        {
          "field": "response_type",
          "operator": "==",
          "value": "Отказ"
        }
      ]
    }
  ]
}
```
