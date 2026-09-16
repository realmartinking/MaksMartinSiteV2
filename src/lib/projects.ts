// Данные проектов для MaksMartin Studio
// 18 проектов брендинга с разными aspect ratios для хаотичной сетки

export type ProjectAspect = 'wide' | 'vertical' | 'square'; // 16:9 | 9:16 | 1:1

export interface Project {
  id: string;
  name: string;
  videoSrc?: string;      // путь к видео в /public/projects/
  imageSrc?: string;      // путь к изображению в /public/projects/ (для PNG проектов)
  imageWebpSrc?: string;  // pixel-identical lossless alternative; PNG stays as fallback
  mediaSize?: readonly [width: number, height: number]; // intrinsic asset dimensions
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
    mediaSize: [1280, 720],
    aspect: 'wide',
    year: '2024',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p19',
    name: 'Skripka',
    videoSrc: '/projects/skripka.mp4',
    mediaSize: [1080, 1350],
    aspect: 'vertical',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p01',
    name: 'Aurica',
    videoSrc: '/projects/aurica.mp4',
    mediaSize: [1280, 720],
    aspect: 'vertical',
    year: '2024',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p18',
    name: 'Шаги',
    videoSrc: '/projects/shagi.mp4',
    mediaSize: [1920, 1080],
    aspect: 'wide',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p03',
    name: 'Value',
    videoSrc: '/projects/value.mp4',
    mediaSize: [1280, 720],
    aspect: 'wide',
    year: '2024',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p04',
    name: 'Muse',
    imageSrc: '/projects/muse.png',
    imageWebpSrc: '/projects/muse.webp',
    mediaSize: [960, 1080],
    aspect: 'vertical',
    year: '2024',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p05',
    name: 'Humber',
    imageSrc: '/projects/humber.png',
    imageWebpSrc: '/projects/humber.webp',
    mediaSize: [1904, 1068],
    aspect: 'wide',
    year: '2024',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p06',
    name: 'Aurix',
    videoSrc: '/projects/aurix.mp4',
    mediaSize: [1280, 720],
    aspect: 'wide',
    year: '2023',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p07',
    name: 'Умное Сердце',
    videoSrc: '/projects/serdtse.mp4',
    mediaSize: [1280, 720],
    aspect: 'vertical',
    year: '2023',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p09',
    name: 'Saga',
    videoSrc: '/projects/saga.mp4',
    mediaSize: [1280, 720],
    aspect: 'vertical',
    year: '2023',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p10',
    name: 'Дача Генерала Вишневецкого',
    imageSrc: '/projects/vishnevetsky.png',
    imageWebpSrc: '/projects/vishnevetsky.webp',
    mediaSize: [1073, 1294],
    aspect: 'wide',
    year: '2023',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p11',
    name: 'Lumio',
    imageSrc: '/projects/lumio.png',
    imageWebpSrc: '/projects/lumio.webp',
    mediaSize: [3840, 2160],
    aspect: 'square',
    year: '2022',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p12',
    name: 'Forma Houseboat',
    videoSrc: '/projects/forma.mp4',
    mediaSize: [1280, 720],
    aspect: 'wide',
    year: '2022',
    type: 'Art Direction',
  },
  {
    id: 'p13',
    name: 'Raif Vision Conference',
    videoSrc: '/projects/raif.mp4',
    mediaSize: [1920, 1080],
    aspect: 'wide',
    year: '2022',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p14',
    name: 'Semya',
    videoSrc: '/projects/semya.mp4',
    mediaSize: [1280, 720],
    aspect: 'vertical',
    year: '2022',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p15',
    name: 'Maoundi',
    videoSrc: '/projects/maoundi.mp4',
    mediaSize: [1280, 720],
    aspect: 'wide',
    year: '2022',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p16',
    name: 'Манеры',
    videoSrc: '/projects/manery.mp4',
    mediaSize: [1280, 720],
    aspect: 'vertical',
    year: '2021',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p17',
    name: 'Russia Expo 2025',
    videoSrc: '/projects/russia-expo.mp4',
    mediaSize: [1020, 1442],
    aspect: 'wide',
    year: '2021',
    type: 'Brand Identity / Art Direction',
  },
];

// A separate selection; the Branding collection stays intact.
export const PRODUCTION_PROJECTS: Project[] = [
  ...['p03', 'p13', 'p12'].map((id) => ({
    ...PROJECTS.find((project) => project.id === id)!,
    type: 'Art Direction',
  })),
  {
    ...PROJECTS.find((project) => project.id === 'p16')!,
    name: 'Новогоднее OLV Манеры',
    type: 'AI Prodaction',
  },
  {
    id: 'production-fashion-summer-awards-2026',
    name: 'Fashion Summer Awards 2026',
    type: 'AI Production',
    videoSrc: '/projects/fashion-summer-awards-2026.mp4',
    mediaSize: [1920, 1080],
    aspect: 'wide',
    year: '2026',
  },
  {
    id: 'production-fashion-tv',
    name: 'Fashion TV',
    type: 'AI Production',
    videoSrc: '/projects/fashion-tv.mp4',
    mediaSize: [1920, 1080],
    aspect: 'wide',
  },
  {
    id: 'production-manery-campaign',
    name: 'РК Манеры',
    type: 'Рекламная компания',
    videoSrc: '/projects/manery-campaign.mp4',
    mediaSize: [1920, 1080],
    aspect: 'wide',
  },
  {
    id: 'production-manery-olv',
    name: 'Манеры OLV',
    type: 'AI Production',
    videoSrc: '/projects/manery-olv-10s.mp4',
    mediaSize: [1920, 1080],
    aspect: 'wide',
  },
];

// Roll starts with Fashion TV; the other Production views keep their order.
export const PRODUCTION_ROLL_PROJECTS = [
  PRODUCTION_PROJECTS.find((project) => project.id === 'production-fashion-tv')!,
  ...PRODUCTION_PROJECTS.filter((project) => project.id !== 'production-fashion-tv'),
];

// Slogan и контактные данные
export const SITE_INFO = {
  name: 'MaksMartin',
  slogan: 'Timeless design, like classical music, love and money',
  telegram: 'https://t.me/martinmuur',
  email: 'martinmursalimov@gmail.com',
};
