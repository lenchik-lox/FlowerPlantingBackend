# Sirius 2 project | Automated Flower Planting

# API

### POST `upload/`
#### Параметры:
|Имя| Описание | Диапазон значений | По умолчанию
|--|--|--|--|
| file | URL файла или сам файл | URL / FILE | Required
| posterize | Значение изогелии | 2-32 | 16
| resolution | Расширение выходного изображения | 16-256 | 64
| colorType | Тип цветопередачи, 0 - монохром, 2 - цветной | 0-6 | 2
| normalize | Нормализация | true/false | false
| grayscale | Монохром | true/false | false
#### Ответ:
```json
	HTTP/1.1 200 OK
	Content-Type: application/json; charset=utf-8
	{
		"status": 200,
		"message": "OK",
		"data": {
			"filename": "ce16bcd7-bd3c-49fa-b1a5-e334e95de309.png",
			"url": "/upload/ce16bcd7-bd3c-49fa-b1a5-e334e95de309.png",
			"mimetype": "image/png",
			"size": 4721,
			"dataurl": "data:image/png;base64,iVBORw0KGgoAAAAN..."
		}
		"error": {}
	}
```