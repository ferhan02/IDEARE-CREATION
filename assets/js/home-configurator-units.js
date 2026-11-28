// Display units only. The saved plan, Three.js scene and estimate always use metres.
export const HOME_UNITS = Object.freeze({
 m: {factor:1, decimals:4},
 mm: {factor:1000, decimals:1},
 ft: {factor:1/0.3048, decimals:5},
 in: {factor:1/0.0254, decimals:4}
});
export const validUnit = u => Object.hasOwn(HOME_UNITS,u) ? u : 'm';
export function toDisplay(metres,unit='m') {return metres*HOME_UNITS[validUnit(unit)].factor;}
export function toMetres(value,unit='m') {return value/HOME_UNITS[validUnit(unit)].factor;}
export function inputValue(metres,unit='m') {return String(Number(toDisplay(metres,unit).toFixed(HOME_UNITS[validUnit(unit)].decimals)));}
export function formatLength(metres,unit='m') {unit=validUnit(unit);const decimals=unit==='mm'?1:unit==='m'?3:2;return `${Number(toDisplay(metres,unit).toFixed(decimals))} ${unit}`;}
export function formatArea(m2,unit='m') {unit=validUnit(unit);const factor=HOME_UNITS[unit].factor;return `${(m2*factor*factor).toLocaleString('en-MY',{maximumFractionDigits:unit==='mm'?0:2})} ${unit}²`;}
export function catalogueDetail(item,unit='m') {
 const len=m=>formatLength(m,unit);
 if(item.tool==='Wall')return len(item.height||2.8);
 if(item.tool==='Break wall')return `${len(1)} section`;
 if(item.tool==='Door')return `${len(.9)} × ${len(item.height||2.1)}`;
 if(item.tool==='Window')return `${len(1.2)} × ${len(item.height||1.2)}`;
 return item.detail;
}
export function catalogueSpecs(item,unit='m') {
 const len=m=>formatLength(m,unit);
 switch(item.tool){
 case 'Door':return `${len(.9)} W × ${len(item.height||2.1)} H`;
 case 'Window':return `${len(1.2)} W × ${len(item.height||1.2)} H · sill ${len(.9)}`;
 case 'Wall':return `${len(item.height||2.8)} high · ${len(.18)} thick`;
 case 'Foundation':return `${len(item.height||.18)} high · custom footprint`;
 case 'Fence':return `${len(1.1)} high · custom length`;
 case 'Stairs':return `${len(3.2)} storey rise · custom footprint`;
 case 'Roof':return `Custom width and depth · ${item.style==='gable'?'gable':'flat'} roof`;
 default:return catalogueDetail(item,unit);
 }
}
