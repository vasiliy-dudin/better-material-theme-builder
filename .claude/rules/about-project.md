# Project Overview

**better material theme builder** — это веб-приложение для генерации цветовых схем Material Design 3 с экспортом в JSON формате. Проект позволяет создавать полные цветовые палитры прямо в приложении без внешних зависимостей. Этот JSON может быть использован для импорта в Figma Variables, в Tokens Studio, или напрямую на фронтенд.

## Ключевые Возможности

### 1. Генерация Цветов
- **Генерация всех цветов Material Design 3**
- Поддержка всех современных вариантов схемы: Tonal Spot, Vibrant, Expressive, Neutral, Monochrome, Fidelity, Content, Rainbow, Fruit Salad
- Поддержка спецификаций цветов Material Design 2021 и 2025
- Extended Colors — дополнительные пользовательские цвета в схеме

### 2. OKLCH Color Picker (Dropdown)
- **Продвинутый дропдаун color picker** с использованием Color.js Elements
- Только OKLCH цветовое пространство (без выбора формата)
- Цветовой превью который открывает dropdown при клике
- Автоматическое закрытие при клике вне области
- Синхронизация в реальном времени: color picker ↔ HEX input ↔ превью
- Анимации и hover эффекты

### 3. Visual sRGB Gamut Indication
- **GamutVisualizer.js** — визуализация sRGB гаммы на слайдерах OKLCH
- Полосатые индикаторы для областей вне sRGB гаммы:
  - Lightness: серые полосы для недоступной яркости
  - Chroma: красные полосы для пересыщенных цветов  
  - Hue: обесцвеченные полосы для недоступных оттенков
- Обновление в реальном времени с debounce 100ms
- Использует `color.inGamut('srgb')` из Color.js

### 5. Design Token Collection Input
- **Настраиваемое имя коллекции** для W3C Design Tokens формата
- По умолчанию: "Semantic colors"
- Связано через UI → app.js → W3cDtcgConverter.js

### 6. Export Options
- **State Layers** — включение/отключение state layers в JSON
- **Tonal Palettes** — включение/отключение тональных палитр
- **W3C Design Tokens Format** — совместимость с Figma (плагин Luckino)
- **Naming Format**: kebab-case, camelCase, Title Case
- **Download JSON** / **Copy to Clipboard**


## Архитектура

### Основные принципы

1. **Простота** - вся логика в одном файле
2. **Самодостаточность** - минимальные зависимости
3. **Читаемость** - четкая структура методов и комментарии
4. **Реактивность** - автоматическое обновление при изменениях
5. **Расширяемость** - легкое добавление новых методов в класс

### Ключевые Компоненты

**UIManager.js** — центральный компонент UI:
- Управление dropdown color picker
- Обработка событий
- Синхронизация цветов
- Интеграция с GamutVisualizer

**ColorGeneratorService.js** — генерация цветов:
- Использует @materialx/material-color-utilities v0.4.6
- Полностью автономная генерация без внешних API
- Поддержка всех Material Design стилей и спецификаций

**GamutVisualizer.js** — визуализация гаммы:
- Расчёт sRGB гаммы для OKLCH слайдеров
- Генерация CSS градиентов с визуальными индикаторами
- Debounced обновления для производительности

## Технический Стек
- **Vanilla JavaScript** (ES6 modules)
- **Vite** — сборщик и dev сервер
- **Bootstrap 5.3.2** — UI фреймворк
- **Color.js Elements** — OKLCH color picker
- **@materialx/material-color-utilities v0.4.6** — библиотека для генерации цветов Material Design
- **Martian Mono** — моноширинный шрифт
- **pnpm** — пакетный менеджер



## Деплой и Разработка

### Dev команды
```bash
pnpm install    # Установка зависимостей
pnpm dev        # Запуск dev сервера (Vite)
pnpm build      # Сборка для продакшена
pnpm deploy     # Публикует папку dist на GitHub Pages
```
