// Данные проектов для MaksMartin Studio
// 18 проектов брендинга с разными aspect ratios для хаотичной сетки

export type ProjectAspect = 'wide' | 'vertical' | 'square'; // 16:9 | 9:16 | 1:1

export interface Project {
  id: string;
  name: string;
  videoSrc?: string;      // путь к видео в /public/projects/
  mobilePreviewBase?: string; // Production preview pair (.mp4 and .webp), in public/
  posterSrc?: string;     // frame shown until video is actually painted
  imageSrc?: string;      // путь к изображению в /public/projects/ (для PNG проектов)
  imageWebpSrc?: string;  // pixel-identical lossless alternative; PNG stays as fallback
  imagePreviewSrcSet?: string; // Smaller versions for cards and mobile displays
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
    posterSrc: '/projects/posters/hightbay.webp',
    mediaSize: [1280, 720],
    aspect: 'wide',
    year: '2024',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p19',
    name: 'Skripka',
    videoSrc: '/projects/skripka.mp4',
    posterSrc: '/projects/posters/skripka.webp',
    mediaSize: [1080, 1350],
    aspect: 'vertical',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p01',
    name: 'Aurica',
    videoSrc: '/projects/aurica.mp4',
    posterSrc: '/projects/posters/aurica.webp',
    mediaSize: [1280, 720],
    aspect: 'vertical',
    year: '2024',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p18',
    name: 'Шаги',
    videoSrc: '/projects/shagi.mp4',
    posterSrc: '/projects/posters/shagi.webp',
    mediaSize: [1920, 1080],
    aspect: 'wide',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p03',
    name: 'Value',
    videoSrc: '/projects/value.mp4',
    posterSrc: '/projects/posters/value.webp',
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
    imagePreviewSrcSet: '/projects/previews/muse-480.webp 480w, /projects/previews/muse-960.webp 960w',
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
    imagePreviewSrcSet: '/projects/previews/humber-480.webp 480w, /projects/previews/humber-1280.webp 1280w, /projects/humber.webp 1904w',
    mediaSize: [1904, 1068],
    aspect: 'wide',
    year: '2024',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p06',
    name: 'Aurix',
    videoSrc: '/projects/aurix.mp4',
    posterSrc: '/projects/posters/aurix.webp',
    mediaSize: [1280, 720],
    aspect: 'wide',
    year: '2023',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p07',
    name: 'Умное Сердце',
    videoSrc: '/projects/serdtse.mp4',
    posterSrc: '/projects/posters/serdtse.webp',
    mediaSize: [1280, 720],
    aspect: 'vertical',
    year: '2023',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p09',
    name: 'Saga',
    videoSrc: '/projects/saga.mp4',
    posterSrc: '/projects/posters/saga.webp',
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
    imagePreviewSrcSet: '/projects/previews/vishnevetsky-480.webp 480w, /projects/previews/vishnevetsky-1073.webp 1073w',
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
    imagePreviewSrcSet: '/projects/previews/lumio-480.webp 480w, /projects/previews/lumio-1280.webp 1280w, /projects/lumio.webp 3840w',
    mediaSize: [3840, 2160],
    aspect: 'square',
    year: '2022',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p12',
    name: 'Forma Houseboat',
    videoSrc: '/projects/forma.mp4',
    posterSrc: '/projects/posters/forma.webp',
    mediaSize: [1280, 720],
    aspect: 'wide',
    year: '2022',
    type: 'Art Direction',
  },
  {
    id: 'p13',
    name: 'Raif Vision Conference',
    videoSrc: '/projects/raif.mp4',
    posterSrc: '/projects/posters/raif.webp',
    mediaSize: [1920, 1080],
    aspect: 'wide',
    year: '2022',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p14',
    name: 'Semya',
    videoSrc: '/projects/semya.mp4',
    posterSrc: '/projects/posters/semya.webp',
    mediaSize: [1280, 720],
    aspect: 'vertical',
    year: '2022',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p15',
    name: 'Maoundi',
    videoSrc: '/projects/maoundi.mp4',
    posterSrc: '/projects/posters/maoundi.webp',
    mediaSize: [1280, 720],
    aspect: 'wide',
    year: '2022',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p16',
    name: 'Манеры',
    videoSrc: '/projects/manery.mp4',
    posterSrc: '/projects/posters/manery.webp',
    mediaSize: [1280, 720],
    aspect: 'vertical',
    year: '2021',
    type: 'Brand Identity / Art Direction',
  },
  {
    id: 'p17',
    name: 'Russia Expo 2025',
    videoSrc: '/projects/russia-expo.mp4',
    posterSrc: '/projects/posters/russia-expo.webp',
    mediaSize: [1020, 1442],
    aspect: 'wide',
    year: '2021',
    type: 'Brand Identity / Art Direction',
  },
];

// A separate selection; the Branding collection stays intact.
export const PRODUCTION_PROJECTS: Project[] = [
  ...[['p03', 'value'], ['p13', 'raif'], ['p12', 'forma']].map(([id, clip]) => ({
    mobilePreviewBase: `/projects/mobile/${clip}`,
    ...PROJECTS.find((project) => project.id === id)!,
    type: 'Art Direction',
  })),
  {
    ...PROJECTS.find((project) => project.id === 'p16')!,
    name: 'Новогоднее OLV Манеры',
    mobilePreviewBase: '/projects/mobile/manery',
    type: 'AI Prodaction',
  },
  {
    id: 'production-fashion-summer-awards-2026',
    name: 'Fashion Summer Awards 2026',
    type: 'AI Production',
    videoSrc: '/projects/fashion-summer-awards-2026.mp4',
    mobilePreviewBase: '/projects/mobile/fashion-summer-awards-2026',
    posterSrc: '/projects/posters/fashion-summer-awards-2026.webp',
    mediaSize: [1920, 1080],
    aspect: 'wide',
    year: '2026',
  },
  {
    id: 'production-fashion-tv',
    name: 'Fashion TV',
    type: 'AI Production',
    videoSrc: '/projects/fashion-tv.mp4',
    mobilePreviewBase: '/projects/mobile/fashion-tv',
    posterSrc: '/projects/posters/fashion-tv.webp',
    mediaSize: [1920, 1080],
    aspect: 'wide',
  },
  {
    id: 'production-manery-campaign',
    name: 'РК Манеры',
    type: 'Рекламная компания',
    videoSrc: '/projects/manery-campaign.mp4',
    mobilePreviewBase: '/projects/mobile/manery-campaign',
    posterSrc: '/projects/posters/manery-campaign.webp',
    mediaSize: [1920, 1080],
    aspect: 'wide',
  },
  {
    id: 'production-manery-olv',
    name: 'Манеры OLV',
    type: 'AI Production',
    videoSrc: '/projects/manery-olv-10s.mp4',
    mobilePreviewBase: '/projects/mobile/manery-olv-10s',
    posterSrc: '/projects/posters/manery-olv-10s.webp',
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

// Applies to narrow phones including rotated iPhones, without switching wide desktop art.
export const MOBILE_PREVIEW_MEDIA = '(max-width: 768px), (max-width: 1024px) and (pointer: coarse)';
