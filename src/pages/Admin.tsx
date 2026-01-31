import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const Admin = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    genre: '',
    year: new Date().getFullYear(),
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const genres = ['Techno', 'Hip-Hop', 'House', 'Electronic', 'Drum & Bass', 'Ambient'];

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const uploadToS3 = async (file: File, type: 'audio' | 'cover'): Promise<string> => {
    const extension = file.name.split('.').pop();
    const CHUNK_SIZE = 2 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    let uploadId = '';
    let cdnUrl = '';
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      
      const chunkBase64 = await fileToBase64(chunk);
      
      const response = await fetch('https://functions.poehali.dev/6708de78-3916-4c66-9b70-c808ff049058', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: chunkBase64,
          type,
          extension,
          chunk: i,
          total_chunks: totalChunks,
          upload_id: uploadId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to upload chunk ${i + 1}/${totalChunks}`);
      }

      const result = await response.json();
      uploadId = result.upload_id;
      
      if (result.completed) {
        cdnUrl = result.cdn_url;
      }
      
      if (totalChunks > 1) {
        toast({
          title: `Загрузка ${type === 'audio' ? 'аудио' : 'обложки'}...`,
          description: `${Math.round((i + 1) / totalChunks * 100)}%`,
        });
      }
    }
    
    return cdnUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioFile) {
      toast({
        title: 'Ошибка',
        description: 'Загрузите аудио файл',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.genre) {
      toast({
        title: 'Ошибка',
        description: 'Выберите жанр',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      toast({
        title: 'Загрузка файлов...',
        description: 'Загружаем аудио в облако',
      });

      const audioUrl = await uploadToS3(audioFile, 'audio');
      console.log('Audio uploaded:', audioUrl);
      
      let coverUrl = null;
      if (coverFile) {
        toast({
          title: 'Загрузка обложки...',
          description: 'Почти готово',
        });
        coverUrl = await uploadToS3(coverFile, 'cover');
        console.log('Cover uploaded:', coverUrl);
      }

      toast({
        title: 'Сохранение...',
        description: 'Добавляем релиз в каталог',
      });

      const saveData = {
        title: formData.title,
        artist: formData.artist,
        genre: formData.genre,
        year: formData.year,
        audio_url: audioUrl,
        cover_url: coverUrl,
      };
      
      console.log('Saving release:', saveData);

      const response = await fetch('https://functions.poehali.dev/08ae4a7f-5e92-485c-8cbb-c62610868621', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData),
      });

      const result = await response.json();
      console.log('Backend response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка сохранения');
      }

      toast({
        title: 'Успешно!',
        description: `Релиз "${formData.title}" добавлен`,
      });

      setFormData({
        title: '',
        artist: '',
        genre: '',
        year: new Date().getFullYear(),
      });
      setAudioFile(null);
      setCoverFile(null);
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось загрузить релиз',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 w-full bg-black/80 backdrop-blur-lg border-b border-primary/20 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="Radio" size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">MAKERS SOUND</h1>
          </div>
          <Button variant="outline" className="border-primary/50" onClick={() => window.location.href = '/'}>
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            На главную
          </Button>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-2xl">
          <div className="mb-12">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/50">
              Админ-панель
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Загрузить релиз</h2>
            <p className="text-muted-foreground text-lg">
              Добавьте новый трек в каталог лейбла
            </p>
          </div>

          <Card className="p-8 bg-card border-primary/20">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title" className="text-base mb-2 block">
                  Название трека *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Night Pulse"
                  required
                  className="bg-secondary/30 border-primary/20"
                />
              </div>

              <div>
                <Label htmlFor="artist" className="text-base mb-2 block">
                  Артист *
                </Label>
                <Input
                  id="artist"
                  value={formData.artist}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  placeholder="DJ Voltage"
                  required
                  className="bg-secondary/30 border-primary/20"
                />
              </div>

              <div>
                <Label className="text-base mb-2 block">Жанр *</Label>
                <div className="flex flex-wrap gap-2">
                  {genres.map((genre) => (
                    <Badge
                      key={genre}
                      variant={formData.genre === genre ? 'default' : 'outline'}
                      className={`cursor-pointer ${
                        formData.genre === genre
                          ? 'bg-primary text-white'
                          : 'hover:bg-primary/10 border-primary/30'
                      }`}
                      onClick={() => setFormData({ ...formData, genre })}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="year" className="text-base mb-2 block">
                  Год выпуска *
                </Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  required
                  className="bg-secondary/30 border-primary/20"
                />
              </div>

              <div>
                <Label htmlFor="audio" className="text-base mb-2 block">
                  Аудио файл (MP3) *
                </Label>
                <div className="relative">
                  <Input
                    id="audio"
                    type="file"
                    accept="audio/mp3,audio/mpeg"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    required
                    className="bg-secondary/30 border-primary/20 cursor-pointer"
                  />
                  {audioFile && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon name="Music" size={16} />
                      {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="cover" className="text-base mb-2 block">
                  Обложка (JPG/PNG)
                </Label>
                <div className="relative">
                  <Input
                    id="cover"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="bg-secondary/30 border-primary/20 cursor-pointer"
                  />
                  {coverFile && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon name="Image" size={16} />
                      {coverFile.name} ({(coverFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Icon name="Upload" size={20} className="mr-2" />
                    Загрузить релиз
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;