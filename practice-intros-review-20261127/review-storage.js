// All review preferences use an isolated namespace. Never clear shared storage.
(()=>{'use strict';
const prefix='pw-practice-intros-review-20261127-v1:';
function scoped(storage){return Object.freeze({getItem:key=>storage().getItem(prefix+String(key)),setItem:(key,value)=>storage().setItem(prefix+String(key),String(value)),removeItem:key=>storage().removeItem(prefix+String(key))});}
Object.defineProperty(window,'PW_REVIEW_STORAGE',{value:scoped(()=>window.localStorage),writable:false,configurable:false});
Object.defineProperty(window,'PW_REVIEW_SESSION',{value:scoped(()=>window.sessionStorage),writable:false,configurable:false});
})();
