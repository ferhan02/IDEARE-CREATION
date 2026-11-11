import { mountPortfolioSlider } from './portfolio-slider.js';
export function mountPortfolioPhone({ motion } = {}) {
    return mountPortfolioSlider({ motion, device: 'phone' });
}
