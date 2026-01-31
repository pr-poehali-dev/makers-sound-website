import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

const Index = () => {
  const [selectedGenre, setSelectedGenre] = useState('Все');
  const [selectedYear, setSelectedYear] = useState('Все');
  const [currentTrack, setCurrentTrack] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetch('https://functions.poehali.dev/08ae4a7f-5e92-485c-8cbb-c62610868621')
      .then(res => res.json())
      .then(data => {
        if (data.releases && data.releases.length > 0) {
          setReleases(data.releases);
        } else {
          setReleases(defaultReleases);
        }
        setLoading(false);
      })
      .catch(() => {
        setReleases(defaultReleases);
        setLoading(false);
      });
  }, []);

  const defaultReleases = [
    {
      id: 1,
      title: 'Night Pulse',
      artist: 'DJ Voltage',
      genre: 'Techno',
      year: 2024,
      cover: '/placeholder.svg',
      preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    },
    {
      id: 2,
      title: 'Urban Echoes',
      artist: 'BassMakers',
      genre: 'Hip-Hop',
      year: 2024,
      cover: '/placeholder.svg',
      preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    },
    {
      id: 3,
      title: 'Midnight Dreams',
      artist: 'Luna Wave',
      genre: 'House',
      year: 2023,
      cover: '/placeholder.svg',
      preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    },
    {
      id: 4,
      title: 'Electric Soul',
      artist: 'The Synths',
      genre: 'Electronic',
      year: 2024,
      cover: '/placeholder.svg',
      preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    },
    {
      id: 5,
      title: 'Dark Matter',
      artist: 'Shadow Beats',
      genre: 'Techno',
      year: 2023,
      cover: '/placeholder.svg',
      preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    },
    {
      id: 6,
      title: 'City Lights',
      artist: 'Urban Soul',
      genre: 'Hip-Hop',
      year: 2024,
      cover: '/placeholder.svg',
      preview: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    },
  ];

  const genres = ['Все', 'Techno', 'Hip-Hop', 'House', 'Electronic', 'Drum & Bass', 'Ambient'];
  const allYears = Array.from(new Set(releases.map(r => r.year))).sort((a, b) => b - a);
  const years = ['Все', ...allYears.map(String)];

  const filteredReleases = releases.filter((release) => {
    const genreMatch = selectedGenre === 'Все' || release.genre === selectedGenre;
    const yearMatch = selectedYear === 'Все' || release.year.toString() === selectedYear;
    return genreMatch && yearMatch;
  });

  const services = [
    { title: 'Дистрибуция', description: 'Распространение музыки на всех популярных платформах', icon: 'Music' },
    { title: 'Продюсирование', description: 'Полный цикл создания трека от идеи до релиза', icon: 'Headphones' },
    { title: 'Мастеринг', description: 'Профессиональная обработка и финализация', icon: 'Settings' },
    { title: 'Продвижение', description: 'Маркетинг и развитие артистов', icon: 'TrendingUp' },
  ];

  const blogPosts = [
    { title: 'Как создать хит в 2024', date: '15 янв 2024', category: 'Продакшн' },
    { title: 'Тренды электронной музыки', date: '10 янв 2024', category: 'Индустрия' },
    { title: 'Гид по мастерингу', date: '5 янв 2024', category: 'Обучение' },
  ];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const playTrack = (trackId: number) => {
    const track = releases.find(r => r.id === trackId);
    if (!track || !audioRef.current) return;

    if (currentTrack === trackId) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      audioRef.current.src = track.preview;
      audioRef.current.play();
      setCurrentTrack(trackId);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = parseFloat(e.target.value);
    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTrackData = releases.find(r => r.id === currentTrack);

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
          <div className="hidden md:flex gap-8">
            <a href="#home" className="hover:text-primary transition-colors">Главная</a>
            <a href="#releases" className="hover:text-primary transition-colors">Релизы</a>
            <a href="#services" className="hover:text-primary transition-colors">Услуги</a>
            <a href="#blog" className="hover:text-primary transition-colors">Блог</a>
            <a href="#contact" className="hover:text-primary transition-colors">Контакты</a>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-primary/50" onClick={() => window.location.href = '/admin'}>
              <Icon name="Upload" size={18} className="mr-2" />
              Админ
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-white">
              Связаться
            </Button>
          </div>
        </div>
      </nav>

      <section id="home" className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left animate-fade-in">
              <Badge className="mb-6 bg-primary/20 text-primary border-primary/50">
                Музыкальный лейбл нового поколения
              </Badge>
              <h2 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter">
                MAKERS<br />
                <span className="text-primary">SOUND</span>
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground mb-12">
                Создаём звук будущего. Продюсируем, издаём и продвигаем электронную музыку на мировой уровень.
              </p>
              <div className="flex gap-4 justify-center md:justify-start">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8">
                  Наши артисты
                </Button>
                <Button size="lg" variant="outline" className="border-primary/50 hover:bg-primary/10">
                  Подать заявку
                </Button>
              </div>
            </div>
            
            <div className="flex justify-center items-center">
              <div className="relative w-80 h-80 md:w-96 md:h-96">
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/50 to-primary/20 rounded-full blur-3xl opacity-30"></div>
                <div className="relative w-full h-full animate-spin-slow">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-primary/30 shadow-2xl shadow-primary/50">
                    <div className="absolute inset-6 rounded-full bg-black flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-primary/30 border-4 border-primary"></div>
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="releases" className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto">
          <div className="mb-12">
            <h3 className="text-4xl md:text-5xl font-black mb-4">Релизы</h3>
            <p className="text-muted-foreground text-lg">Свежие треки от наших артистов</p>
          </div>

          <div className="mb-8 flex flex-wrap gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Жанр:</p>
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <Badge
                    key={genre}
                    variant={selectedGenre === genre ? 'default' : 'outline'}
                    className={`cursor-pointer ${
                      selectedGenre === genre
                        ? 'bg-primary text-white'
                        : 'hover:bg-primary/10 border-primary/30'
                    }`}
                    onClick={() => setSelectedGenre(genre)}
                  >
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Год:</p>
              <div className="flex flex-wrap gap-2">
                {years.map((year) => (
                  <Badge
                    key={year}
                    variant={selectedYear === year ? 'default' : 'outline'}
                    className={`cursor-pointer ${
                      selectedYear === year
                        ? 'bg-primary text-white'
                        : 'hover:bg-primary/10 border-primary/30'
                    }`}
                    onClick={() => setSelectedYear(year)}
                  >
                    {year}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReleases.map((release, index) => (
              <Card
                key={release.id}
                className="bg-card border-primary/20 overflow-hidden hover-scale group cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="aspect-square bg-gradient-to-br from-primary/30 to-primary/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      size="lg" 
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => playTrack(release.id)}
                    >
                      <Icon name={currentTrack === release.id && isPlaying ? "Pause" : "Play"} size={24} />
                    </Button>
                  </div>
                </div>
                <div className="p-6">
                  <Badge className="mb-2 bg-primary/20 text-primary border-primary/50">
                    {release.genre}
                  </Badge>
                  <h4 className="text-xl font-bold mb-1">{release.title}</h4>
                  <p className="text-muted-foreground">{release.artist}</p>
                  <p className="text-sm text-muted-foreground mt-2">{release.year}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="py-20 px-6">
        <div className="container mx-auto">
          <div className="mb-12">
            <h3 className="text-4xl md:text-5xl font-black mb-4">Услуги</h3>
            <p className="text-muted-foreground text-lg">Полный спектр музыкального производства</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service, index) => (
              <Card
                key={index}
                className="p-8 bg-card border-primary/20 hover:border-primary/50 transition-all hover-scale"
              >
                <div className="w-16 h-16 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <Icon name={service.icon} size={32} className="text-primary" />
                </div>
                <h4 className="text-2xl font-bold mb-2">{service.title}</h4>
                <p className="text-muted-foreground">{service.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="blog" className="py-20 px-6 bg-secondary/30">
        <div className="container mx-auto">
          <div className="mb-12">
            <h3 className="text-4xl md:text-5xl font-black mb-4">Блог</h3>
            <p className="text-muted-foreground text-lg">Новости и статьи о музыкальной индустрии</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogPosts.map((post, index) => (
              <Card
                key={index}
                className="p-6 bg-card border-primary/20 hover:border-primary/50 transition-all cursor-pointer hover-scale"
              >
                <Badge className="mb-4 bg-primary/20 text-primary border-primary/50">
                  {post.category}
                </Badge>
                <h4 className="text-xl font-bold mb-2">{post.title}</h4>
                <p className="text-sm text-muted-foreground">{post.date}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-4xl md:text-5xl font-black mb-6">Готовы начать?</h3>
          <p className="text-xl text-muted-foreground mb-8">
            Свяжитесь с нами и станьте частью MAKERS SOUND
          </p>
          <div className="flex gap-4 justify-center mb-12">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
              <Icon name="Mail" size={20} className="mr-2" />
              Email
            </Button>
            <Button size="lg" variant="outline" className="border-primary/50 hover:bg-primary/10">
              <Icon name="MessageCircle" size={20} className="mr-2" />
              Telegram
            </Button>
            <Button size="lg" variant="outline" className="border-primary/50 hover:bg-primary/10">
              <Icon name="Instagram" size={20} className="mr-2" />
              Instagram
            </Button>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-primary/20">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2024 MAKERS SOUND. Все права защищены.</p>
        </div>
      </footer>

      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-primary/20 z-50">
          <audio ref={audioRef} />
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary/30 to-primary/10 rounded-lg flex-shrink-0"></div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-bold truncate">{currentTrackData?.title}</h4>
                <p className="text-sm text-muted-foreground truncate">{currentTrackData?.artist}</p>
              </div>

              <div className="flex-1 max-w-md mx-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground w-12 text-right">{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-1 bg-muted rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                  />
                  <span className="text-xs text-muted-foreground w-12">{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    const currentIndex = releases.findIndex(r => r.id === currentTrack);
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : releases.length - 1;
                    playTrack(releases[prevIndex].id);
                  }}
                >
                  <Icon name="SkipBack" size={20} />
                </Button>

                <Button
                  size="icon"
                  className="bg-primary hover:bg-primary/90 w-12 h-12"
                  onClick={() => playTrack(currentTrack)}
                >
                  <Icon name={isPlaying ? "Pause" : "Play"} size={24} />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    const currentIndex = releases.findIndex(r => r.id === currentTrack);
                    const nextIndex = currentIndex < releases.length - 1 ? currentIndex + 1 : 0;
                    playTrack(releases[nextIndex].id);
                  }}
                >
                  <Icon name="SkipForward" size={20} />
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setCurrentTrack(null);
                    setIsPlaying(false);
                    if (audioRef.current) {
                      audioRef.current.pause();
                      audioRef.current.src = '';
                    }
                  }}
                >
                  <Icon name="X" size={20} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;