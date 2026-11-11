import { mountPortfolioSlider } from './portfolio-slider.js';
export function mountPortfolioTablet({ motion } = {}) {
    return mountPortfolioSlider({ motion, device: 'tablet' });
}
