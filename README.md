# Sirius 2 project | Automated Flower Planting



# API

### POST `upload/`
#### Параметры:
|Имя| Описание | Диапазон значений | По умолчанию
|--|--|--|--|
| file | URL файла или сам файл | URL / FILE | Required
| posterize | Значение изогелии | 2-32 | 16
| resolution | Расширение выходного изображения | 16-256 | 64
| colorType | Группы каналов, 0 - монохром без альфа-канала, 2 - цветной без альфа-канала, 4 - монохром с альфа-каналом, 6 - цветной с альфа каналом | 0-6 | 2
| normalize | Нормализация | true/false | false
| grayscale | Монохром | true/false | false
#### Запрос:
```http
POST /upload HTTP/1.1
Host: localhost:3000
Content-Type: application/x-www-form-urlencoded
Content-Length: 169

file=https%3A%2F%2Fwww.pnglib.com%2Fwp-content%2Fuploads%2F2020%2F08%2Fshiba-inu-barking_5f33fde9d8bbe.png&
posterize=4&
resolution=256&
colorType=2&
normalize=1&
grayscale=0
```
#### Ответ:
```json
	HTTP/1.1 200 OK
	Content-Type: application/json; charset=utf-8
	{
		"status": 200,
		"message": "OK",
		"data": {
			"filename": "e49a6e5b-a58a-489d-9517-250169f5c85a.png",
			"url": "/upload/e49a6e5b-a58a-489d-9517-250169f5c85a.png",
			"mimetype": "image/png",
			"size": 6921,
			"dataurl": "data:image/png;base64,iVBORw0KGgoAAAAN..."
		}
		"error": {}
	}
```