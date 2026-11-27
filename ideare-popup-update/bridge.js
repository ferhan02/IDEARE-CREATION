/* IDEARE item preview bridge v1: read the actual live scene; never modify it. */
import {installItemPreviews} from './designer-item-previews.js?v=20261127-popup1';
try {
 const itemPreviews=installItemPreviews({THREE,
  isBuild:()=>model.step===3,
  getSource:(type,id)=>type==='cabinet'?meshById.get(id):type==='extra'?extraGroup?.children.find(o=>o.userData.extraId===id):worldGroup?.getObjectByName('ideare_wall_backsplashes')?.children.find(o=>o.userData.splashId===id),
  getSpec:(type,id)=>{const item=type==='cabinet'?model.cabinets.find(o=>o.uid===id):type==='extra'?model.extras.find(o=>o.id===id):model.room.backsplashes?.find(o=>o.id===id);return {...item,doorsOpen:type==='cabinet'&&model.selected===id&&model.doorsOpen,fridgeOpen:type==='cabinet'&&!!item&&ideareFridgeDoorPreview(item)};}
 });
 const drawBeforeItemPreviews=drawScene;drawScene=(...args)=>{const result=drawBeforeItemPreviews(...args);itemPreviews.refresh();return result;};
} catch(error) {console.warn('IDEARE item previews could not initialize',error);}
