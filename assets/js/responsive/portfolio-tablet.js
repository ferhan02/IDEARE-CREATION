import { mountPortfolioDesktop } from './portfolio-desktop.js';
export function mountPortfolioTablet({motion}={}) { return mountPortfolioDesktop({motion,device:'tablet'}); }
