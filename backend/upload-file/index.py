import json
import os
import boto3
import uuid
import base64

def handler(event: dict, context) -> dict:
    '''Загружает файл в S3 через base64 (chunked upload для больших файлов)'''
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
        file_data = body.get('data')
        file_type = body.get('type', 'audio')
        file_extension = body.get('extension', 'mp3')
        chunk_index = body.get('chunk', 0)
        total_chunks = body.get('total_chunks', 1)
        upload_id = body.get('upload_id')
        
        if not file_data:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'No file data provided'}),
                'isBase64Encoded': False
            }
        
        s3 = boto3.client('s3',
            endpoint_url='https://bucket.poehali.dev',
            aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
            aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
        )
        
        if not upload_id:
            upload_id = str(uuid.uuid4())
        
        folder = 'releases' if file_type == 'audio' else 'covers'
        file_key = f'{folder}/{upload_id}.{file_extension}'
        
        decoded_data = base64.b64decode(file_data)
        content_type = 'audio/mpeg' if file_type == 'audio' else 'image/jpeg'
        
        if total_chunks == 1:
            s3.put_object(
                Bucket='files',
                Key=file_key,
                Body=decoded_data,
                ContentType=content_type
            )
            
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{file_key}"
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'cdn_url': cdn_url,
                    'upload_id': upload_id,
                    'completed': True
                }),
                'isBase64Encoded': False
            }
        else:
            temp_key = f'temp/{upload_id}_chunk_{chunk_index}'
            s3.put_object(
                Bucket='files',
                Key=temp_key,
                Body=decoded_data
            )
            
            if chunk_index == total_chunks - 1:
                parts = []
                for i in range(total_chunks):
                    chunk_key = f'temp/{upload_id}_chunk_{i}'
                    response = s3.get_object(Bucket='files', Key=chunk_key)
                    parts.append(response['Body'].read())
                    s3.delete_object(Bucket='files', Key=chunk_key)
                
                full_data = b''.join(parts)
                s3.put_object(
                    Bucket='files',
                    Key=file_key,
                    Body=full_data,
                    ContentType=content_type
                )
                
                cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{file_key}"
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'cdn_url': cdn_url,
                        'upload_id': upload_id,
                        'completed': True
                    }),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'upload_id': upload_id,
                        'chunk': chunk_index,
                        'completed': False
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
