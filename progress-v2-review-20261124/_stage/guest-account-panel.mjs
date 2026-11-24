// Public guest review only: no Auth SDK, endpoint, credentials or cloud sync.
import {formatProgressExport} from './progress-export.mjs';
import {progressLocale} from './progress-copy.mjs';
const ru=()=>progressLocale()==='ru';
export async function mountAccountPanel({ledger,show,canSwitch,settle}){
  const panel=document.createElement('details');panel.id='pwV2AccountPanel';
  panel.innerHTML='<summary id="pwReviewAccountTitle"></summary><p id="pwV2AccountState" role="status" data-state="local"></p><p id="pwReviewAccountNote"></p><button type="button" id="pwV2Export"></button><p id="pwReviewExportStatus" role="status"></p>';
  document.getElementById('pwModeProgress').after(panel);
  const state=()=>({signedIn:false,owner:null,email:'',unavailable:false,transitioning:false,syncing:false,syncError:false,deletionPending:false});
  const el=id=>document.getElementById(id);
  let busy=false;
  function render(){
    el('pwReviewAccountTitle').textContent=ru()?'Аккаунт и резервная копия':'Account and backup';
    el('pwV2AccountState').textContent=ru()?'История сохраняется отдельно в этом браузере':'History is saved separately in this browser';
    el('pwReviewAccountNote').textContent=ru()?'Это гостевой предпросмотр. Email, Google, облачная синхронизация и удаление аккаунта отключены. Данные действующего приложения не используются.':'Guest review only. Email, Google, cloud sync and account deletion are disabled. Released-app data is not used.';
    el('pwV2Export').textContent=ru()?'Скачать историю (JSON)':'Export saved progress (JSON)';
    el('pwReviewBanner').textContent=ru()?'Тестовая версия · отдельная локальная история':'Review build · separate local history';
    show('local',el('pwV2AccountState').textContent);
  }
  el('pwV2Export').onclick=async()=>{
    if(busy||!canSwitch())return;
    busy=true;el('pwV2Export').disabled=true;
    try{
      await settle();
      const data=formatProgressExport(await ledger.read(),null);
      const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download='5-progress-review.json';document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      el('pwReviewExportStatus').textContent=ru()?'Локальная копия готова.':'Local copy prepared.';
    }catch(_){el('pwReviewExportStatus').textContent=ru()?'Не удалось скачать историю.':'Could not export history.';}
    finally{busy=false;el('pwV2Export').disabled=false;}
  };
  document.addEventListener('pw:locale-changed',render);document.addEventListener('pw:locale-ready',render);
  render();
  return {state,update:async()=>render(),blocksStart:()=>busy,synchronize:async()=>{}};
}
