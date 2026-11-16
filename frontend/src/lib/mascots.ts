/* 12 mascot đại diện cho 12 level. Mỗi bạn có màu, loài và phụ kiện riêng.
   Mascot 3D dùng cùng cấu hình này để vẽ bằng three.js. */

export type MascotId =
  | 'mochi'
  | 'kiko'
  | 'hoot'
  | 'taro'
  | 'waddles'
  | 'mint'
  | 'bao'
  | 'brownie'
  | 'rex'
  | 'bolt'
  | 'leo'
  | 'astra'

export type MascotSpecies =
  | 'bunny'
  | 'fox'
  | 'owl'
  | 'cat'
  | 'penguin'
  | 'frog'
  | 'panda'
  | 'otter'
  | 'dino'
  | 'robot'
  | 'lion'
  | 'dragon'

export type MascotConfig = {
  id: MascotId
  name: string
  species: MascotSpecies
  levelId: string
  tagline: string
  body: string
  belly: string
  accent: string
  dark: string
  inner: string
}

export const MASCOTS: Record<MascotId, MascotConfig> = {
  mochi: {
    id: 'mochi',
    name: 'Mochi',
    species: 'bunny',
    levelId: '1-1',
    tagline: 'Thỏ trắng dịu dàng, thích lắng nghe bạn nói.',
    body: '#d8c9f2',
    belly: '#ffffff',
    accent: '#ff5fa2',
    dark: '#4a2334',
    inner: '#ffc4dd',
  },
  kiko: {
    id: 'kiko',
    name: 'Kiko',
    species: 'fox',
    levelId: '1-2',
    tagline: 'Cáo cam nhanh nhẹn, mê khám phá điều mới.',
    body: '#ff8a1f',
    belly: '#fff2df',
    accent: '#e85d04',
    dark: '#3a1d08',
    inner: '#ffd7ad',
  },
  hoot: {
    id: 'hoot',
    name: 'Hoot',
    species: 'owl',
    levelId: '1-3',
    tagline: 'Cú tím thông thái, luôn có sổ tay bên mình.',
    body: '#58cc02',
    belly: '#eaffd2',
    accent: '#ff9600',
    dark: '#1e3d00',
    inner: '#a8e86a',
  },
  taro: {
    id: 'taro',
    name: 'Taro',
    species: 'cat',
    levelId: '1-4',
    tagline: 'Mèo kem tò mò, hỏi lại mọi điều chưa rõ.',
    body: '#b98cff',
    belly: '#f6efff',
    accent: '#7d4bd8',
    dark: '#2c1847',
    inner: '#dcc9ff',
  },
  waddles: {
    id: 'waddles',
    name: 'Waddles',
    species: 'penguin',
    levelId: '2-1',
    tagline: 'Cánh cụt lạch bạch nhưng cực kỳ bền bỉ.',
    body: '#2f4b6e',
    belly: '#ffffff',
    accent: '#ff9600',
    dark: '#142336',
    inner: '#7ea6cc',
  },
  mint: {
    id: 'mint',
    name: 'Mint',
    species: 'frog',
    levelId: '2-2',
    tagline: 'Ếch xanh vui vẻ, nhảy một cái là tới quán cà phê.',
    body: '#2ec4b6',
    belly: '#e6fff9',
    accent: '#0f9488',
    dark: '#0b3b36',
    inner: '#9ff0e6',
  },
  bao: {
    id: 'bao',
    name: 'Bao',
    species: 'panda',
    levelId: '2-3',
    tagline: 'Gấu trúc chăm chỉ, đi siêu thị không bao giờ quên giỏ.',
    body: '#f7f7f2',
    belly: '#ffffff',
    accent: '#2b2b2b',
    dark: '#141414',
    inner: '#dcdcd4',
  },
  brownie: {
    id: 'brownie',
    name: 'Brownie',
    species: 'otter',
    levelId: '2-4',
    tagline: 'Rái cá tinh nghịch, cuối tuần nào cũng rủ bạn đi chơi.',
    body: '#b06a3c',
    belly: '#ffe8cf',
    accent: '#1cb0f6',
    dark: '#3f2310',
    inner: '#e0b189',
  },
  rex: {
    id: 'rex',
    name: 'Rex',
    species: 'dino',
    levelId: '3-1',
    tagline: 'Khủng long teal dũng cảm, dám giơ tay phát biểu.',
    body: '#3ecf8e',
    belly: '#f0fff7',
    accent: '#ff9600',
    dark: '#145035',
    inner: '#a9f2cf',
  },
  bolt: {
    id: 'bolt',
    name: 'Bolt',
    species: 'robot',
    levelId: '3-2',
    tagline: 'Robot nhỏ chuyên viết email gọn gàng, đúng hẹn.',
    body: '#79b7e6',
    belly: '#e9f6ff',
    accent: '#1cb0f6',
    dark: '#20415c',
    inner: '#c9e6fa',
  },
  leo: {
    id: 'leo',
    name: 'Leo',
    species: 'lion',
    levelId: '3-3',
    tagline: 'Sư tử vàng tự tin, đứng trước đám đông vẫn bình tĩnh.',
    body: '#ffb020',
    belly: '#fff4d6',
    accent: '#e07a00',
    dark: '#4a2b00',
    inner: '#ffe09a',
  },
  astra: {
    id: 'astra',
    name: 'Astra',
    species: 'dragon',
    levelId: '3-4',
    tagline: 'Rồng tím mơ mộng, mang theo ước mơ chinh phục cả khóa học.',
    body: '#9f6bff',
    belly: '#f2eaff',
    accent: '#ffd43b',
    dark: '#2a1450',
    inner: '#d8c4ff',
  },
}

export const MASCOT_LIST = Object.values(MASCOTS)

export function mascotForLevel(levelId: string): MascotConfig {
  return MASCOT_LIST.find((mascot) => mascot.levelId === levelId) ?? MASCOTS.mochi
}
