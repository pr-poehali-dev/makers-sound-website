import json
import os
import boto3
import uuid

def handler(event: dict, context) -> dict:
    '''Генерирует presigned URL для загрузки файлов в S3'''
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        file_type = body.get('type', 'audio')
        file_extension = body.get('extension', 'mp3')
        
        s3 = boto3.client('s3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
        )
        
        folder = 'releases' if file_type == 'audio' else 'covers'
        file_key = f'{folder}/{uuid.uuid4()}.{file_extension}'
        
        presigned_url = s3.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': 'files',
                'Key': file_key,
                'ContentType': f'audio/mpeg' if file_type == 'audio' else 'image/jpeg'
            },
            ExpiresIn=3600
        )
        
        cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{file_key}"
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'upload_url': presigned_url,
                'cdn_url': cdn_url,
                'key': file_key
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
