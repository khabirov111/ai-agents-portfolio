# Сменный дайджест для компьютерного клуба

## 🎯 Задача
Владелец клуба тратил 30 минут в день на составление отчетов по сменам.

## 💡 Решение
AI-агент в n8n автоматически:
1. Получает Excel-отчет от Langame в Telegram.
2. Парсит данные через Extract from File.
3. Формирует дайджест через DeepSeek.
4. Отправляет готовый отчет в Telegram.

## 🔧 Стек
- n8n
- DeepSeek Chat Model
- Telegram Bot API
- Extract from File (XLSX)

## 📊 Результат
- Экономия 10 часов в неделю.
- Отчеты приходят автоматически.
- Ошибки обрабатываются через IF-ноды.

## 📁 Файлы
- `https://github.com/khabirov111/ai-agents-portfolio/blob/main/daily-digest/%D0%9E%D1%82%D1%87%D1%91%D1%82%20%D0%B7%D0%B0%201%20%D1%81%D0%BC%D0%B5%D0%BD%D1%83%20(2).json` — экспорт workflow.
- `prompt.md` — системный промпт.
