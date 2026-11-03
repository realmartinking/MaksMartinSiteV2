export const MOBILE_LAYOUT_QUERY = '(max-width: 768px), (max-width: 1000px) and (pointer: coarse)';
export const productionLanding = (mobile: boolean) => mobile ? '/production/folder' : '/production/roll';
