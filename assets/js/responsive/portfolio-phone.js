import { mountPortfolioDesktop } from './portfolio-desktop.js';
export function mountPortfolioPhone({motion}={}) { return mountPortfolioDesktop({motion,device:'phone'}); }
