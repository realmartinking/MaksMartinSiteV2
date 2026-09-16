export const PRODUCTION_MOBILE_QUERY = '(max-width: 768px)';
export const productionLanding = (mobile: boolean) => mobile ? '/production/folder' : '/production/roll';
