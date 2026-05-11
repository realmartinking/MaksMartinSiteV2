// Данные проектов для MaksMartin Studio
// 17 проектов с разными aspect ratios для хаотичной сетки

export type ProjectAspect = 'wide' | 'vertical' | 'square'; // 16:9 | 9:16 | 1:1

export interface Project {
  id: string;
  name: string;
  videoSrc?: string;      // путь к видео в /public/projects/
  imageSrc?: string;      // путь к изображению в /public/projects/ (для PNG проектов)
  aspect: ProjectAspect;
  url?: string;           // ссылка на проект (опционально)
  year?: string;
  type?: string;          // тип работы
}

export const PROJECTS: Project[] = [
  {
    id: 'p02',
    name: 'High Bay',
    videoSrc: '/projects/hightbay.mp4',
    aspect: 'wide',
    year: '2024',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p19',
    name: 'Skripka',
    videoSrc: '/projects/skripka.mp4',
    aspect: 'vertical',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p01',
    name: 'Aurica',
    videoSrc: '/projects/aurica.mp4',
    aspect: 'vertical',
    year: '2024',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p18',
    name: 'Шаги',
    videoSrc: '/projects/shagi.mp4',
    aspect: 'wide',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p03',
    name: 'Value',
    videoSrc: '/projects/value.mp4',
    aspect: 'wide',
    year: '2024',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p04',
    name: 'Muse',
    imageSrc: '/projects/muse.png',
    aspect: 'vertical',
    year: '2024',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p05',
    name: 'Humber',
    imageSrc: '/projects/humber.png',
    aspect: 'wide',
    year: '2024',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p06',
    name: 'Aurix',
    videoSrc: '/projects/aurix.mp4',
    aspect: 'wide',
    year: '2023',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p07',
    name: 'Умное Сердце',
    videoSrc: '/projects/serdtse.mp4',
    aspect: 'vertical',
    year: '2023',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p08',
    name: 'Наследие',
    videoSrc: '/projects/nasledie.mp4',
    aspect: 'wide',
    year: '2023',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p09',
    name: 'Saga',
    videoSrc: '/projects/saga.mp4',
    aspect: 'vertical',
    year: '2023',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p10',
    name: 'Дача Генерала Вишневецкого',
    imageSrc: '/projects/vishnevetsky.png',
    aspect: 'wide',
    year: '2023',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p11',
    name: 'Lumio',
    imageSrc: '/projects/lumio.png',
    aspect: 'square',
    year: '2022',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p12',
    name: 'Forma Houseboat',
    videoSrc: '/projects/forma.mp4',
    aspect: 'wide',
    year: '2022',
    type: 'Art Direction',
  },
  {
    id: 'p13',
    name: 'Raif Vision Conference',
    videoSrc: '/projects/raif.mp4',
    aspect: 'wide',
    year: '2022',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p14',
    name: 'Semya',
    videoSrc: '/projects/semya.mp4',
    aspect: 'vertical',
    year: '2022',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p15',
    name: 'Maoundi',
    videoSrc: '/projects/maoundi.mp4',
    aspect: 'wide',
    year: '2022',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p16',
    name: 'Манеры',
    videoSrc: '/projects/manery.mp4',
    aspect: 'vertical',
    year: '2021',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p17',
    name: 'Russia Expo 2025',
    videoSrc: '/projects/russia-expo.mp4',
    aspect: 'wide',
    year: '2021',
    type: 'Brand Identity / Art Direction',
  },
];

// Slogan и контактные данные
export const SITE_INFO = {
  name: 'MaksMartin',
  slogan: 'Timeless design, like classical music, love and money',
  telegram: 'https://t.me/martinmuur',
  email: 'martinmursalimov@gmail.com',
};
