
(()=>{'use strict';
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  if(!reduce.matches)document.documentElement.classList.add('js-motion');
  const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
  const chapters=$$('[data-chapter]'),rails=$$('.rail a'),progress=$('#progressBar');
  let scrollTick=false;
  function updateScroll(){
    const max=document.documentElement.scrollHeight-innerHeight;
    progress.style.transform=`scaleX(${max>0?clamp(window.scrollY/max,0,1):0})`;
    let selected=0;let best=Infinity;
    chapters.forEach((sec,i)=>{const r=sec.getBoundingClientRect();const distance=Math.abs(r.top-90);if(distance<best){best=distance;selected=i;}});
    rails.forEach((a,i)=>{if(i===selected)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});
    updateGallery();scrollTick=false;
  }
  addEventListener('scroll',()=>{if(!scrollTick){scrollTick=true;requestAnimationFrame(updateScroll)}},{passive:true});
  addEventListener('resize',updateScroll);
  const reveal=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');reveal.unobserve(e.target)}}),{threshold:.11});
  $$('[data-reveal]').forEach(el=>reveal.observe(el));

  // Three independently composited photos dissolve within ONE stationary frame.
  const gal=$('#chapter-gallery'),photos=$$('.gallery-photo'),sceneButtons=$$('[data-scene-btn]');
  const sceneTitles=['الاقتلاع.','غرفة الانتظار.','زقاق الحصار.'];
  const sceneNotes=['الاقتلاع من المألوف حين يضيق بك ما حولك.','انتظار الإجابة ممن لا يمنحك إلا مزيداً من التبرير.','تضيق المسارات حين تصبح المعايير معكوسة.'];
  let currentScene=0,overrideScene=null,overrideUntil=0;
  function setScene(idx,opacities){
    const chosen=clamp(idx,0,2);if(chosen!==currentScene){currentScene=chosen;$('#gallery-heading').textContent=sceneTitles[chosen];$('#galleryDescription').textContent=sceneNotes[chosen]}
    photos.forEach((e,i)=>{e.style.opacity=opacities?clamp(opacities[i],0,1):Number(i===chosen);e.classList.toggle('is-current',i===chosen)});
    sceneButtons.forEach((e,i)=>e.setAttribute('aria-pressed',String(i===chosen)));
  }
  function updateGallery(){
    if(reduce.matches || matchMedia("(max-width:767px)").matches){setScene(currentScene);return;}
    const max=Math.max(1,gal.offsetHeight-innerHeight),r=gal.getBoundingClientRect();
    const p=clamp(-r.top/max,0,1);
    if(overrideScene!==null && performance.now()<overrideUntil){setScene(overrideScene);return}
    overrideScene=null;
    // Phase 1: displacement to waiting; phase 2: waiting to alley.
    const o=[clamp(1-p*2,0,1),p<=.5?clamp(p*2,0,1):clamp((1-p)*2,0,1),clamp((p-.5)*2,0,1)];
    setScene(p<.25?0:p<.75?1:2,reduce.matches?null:o);
  }
  sceneButtons.forEach(btn=>btn.addEventListener('click',()=>{overrideScene=Number(btn.dataset.sceneBtn);overrideUntil=Infinity;setScene(overrideScene)}));

  // Semantic vector balance: no raster image for lines, and actual ±5.5 degree rotation.
  let comparison=0;const moving=$('#balanceMoving'),clay=$('#clayShape');
  $('#compareBtn').addEventListener('click',()=>{
    comparison++;
    const angle=comparison%2===1?5.5:-5.5;
    moving.style.transform=`rotate(${angle}deg)`;
    clay.style.opacity='1';clay.classList.remove('dropping');void clay.getBoundingClientRect();
    if(!reduce.matches)clay.classList.add('dropping');
    $('#scaleStatus').textContent=`المقارنة ${comparison.toLocaleString('ar')}: مال الميزان ${Math.abs(angle)}° نحو ${angle>0?'الثمن':'المبدأ'}.`;
  });

  $('#compassBtn').addEventListener('click',()=>{const section=$('#chapter-06');const fixed=section.classList.toggle('resolved');$('#compassStatus').textContent=fixed?'استقرت الإبرة على المبدأ.':'الإبرة تبحث عن وجهتها.';$('#compassBtn').textContent=fixed?'أعِد التجربة ↺':'أعِد البوصلة إلى وجهتها ↖'});
  $('#fullTextBtn').addEventListener('click',()=>$('#fullTextDialog').showModal());
  $('#closeDialog').addEventListener('click',()=>$('#fullTextDialog').close());
  $('#fullTextDialog').addEventListener('click',e=>{if(e.target.id==='fullTextDialog')e.target.close()});

  // Local narration ONLY. Browser receives an ObjectURL; file is never sent to a server.
  const audio=$('#realNarration'),audioInput=$('#audioInput'),audioToggle=$('#audioToggle');let audioURL=null;
  function showToast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(showToast.timeout);showToast.timeout=setTimeout(()=>el.classList.remove('show'),3400)}
  audioInput.addEventListener('change',()=>{
    const f=audioInput.files&&audioInput.files[0];if(!f)return;
    if(!f.type.startsWith('audio/')&&!/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(f.name)){showToast('اختر ملفاً صوتياً صالحاً.');audioInput.value='';return}
    audio.pause();if(audioURL)URL.revokeObjectURL(audioURL);
    audioURL=URL.createObjectURL(f);audio.src=audioURL;audio.load();audioToggle.hidden=false;audioToggle.textContent='تشغيل';$('#audioButtonText').textContent='تغيير الملف';$('#audioLabel').title=f.name;showToast('أُرفق التسجيل محلياً. لا يُرسل إلى خادم.');
  });
  $('#audioLabel').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();audioInput.click()}});
  audioToggle.addEventListener('click',async()=>{if(!audio.src){showToast('أرفق تسجيلك الحقيقي أولاً.');return}if(audio.paused){try{await audio.play()}catch(_){showToast('تعذّر تشغيل الملف. جرّب MP3 أو WAV.')}}else audio.pause()});
  audio.addEventListener('play',()=>{audioToggle.textContent='إيقاف مؤقت';audioToggle.setAttribute('aria-label','إيقاف التسجيل مؤقتاً')});
  audio.addEventListener('pause',()=>{audioToggle.textContent='تشغيل';audioToggle.setAttribute('aria-label','تشغيل التسجيل')});
  audio.addEventListener('ended',()=>showToast('انتهى التسجيل.'));
  audio.addEventListener('error',()=>{if(audio.src)showToast('تعذّر قراءة التسجيل. اختر ملفاً صوتياً آخر.')});
  addEventListener('pagehide',()=>{if(audioURL)URL.revokeObjectURL(audioURL)});
  const shareUrl=encodeURIComponent('https://kakramah.github.io/compass-of-integrity/'),shareTitle=encodeURIComponent('أصلح بوصلتك');
  const shareTargets={whatsapp:`https://wa.me/?text=${shareTitle}%20${shareUrl}`,telegram:`https://t.me/share/url?url=${shareUrl}&text=${shareTitle}`,x:`https://x.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`,facebook:`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`};
  $$('[data-share]').forEach(a=>a.href=shareTargets[a.dataset.share]);
  $('#shareBtn').addEventListener('click',async()=>{try{if(navigator.share){await navigator.share({title:document.title,url:location.href});return}if(navigator.clipboard){await navigator.clipboard.writeText(location.href);showToast('نُسخ رابط الصفحة.');return}showToast('استخدم شريط العنوان لنسخ رابط الصفحة.')}catch(e){if(e.name!=='AbortError')showToast('تعذّرت المشاركة هنا.')}});

  // Performance-bounded live procedural dust. Reduced-motion receives static canvas.
  const canvas=$('#dustCanvas'),ctx=canvas.getContext('2d',{alpha:true});
  if(ctx){let W=0,H=0,points=[],visible=true,frame=0,animation=0;
    function seed(){const dpr=Math.min(devicePixelRatio||1,2),box=canvas.getBoundingClientRect();W=box.width;H=box.height;canvas.width=Math.max(1,Math.round(W*dpr));canvas.height=Math.max(1,Math.round(H*dpr));ctx.setTransform(dpr,0,0,dpr,0,0);
      const count=Math.min(220,Math.max(85,Math.round(W*H/6500)));
      points=Array.from({length:count},(_,i)=>({x:(i*71.91%count)/count*W,y:((i*47.31+13)%count)/count*H,dx:(Math.sin(i*19.2)*.25),dy:-(.08+((i*11)%11)/60),r:.4+(i%5)*.18,o:.1+((i*17)%10)/50}));
    }
    function draw(){ctx.clearRect(0,0,W,H);for(const p of points){if(!reduce.matches){p.x+=p.dx;p.y+=p.dy;if(p.y<0)p.y=H;if(p.x<0)p.x=W;if(p.x>W)p.x=0}ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(242,238,230,${p.o})`;ctx.fill()}}
    function tick(){if(!visible){animation=0;return}draw();animation=requestAnimationFrame(tick)}
    seed();draw();if(!reduce.matches)tick();
    const dustObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible&&!reduce.matches&&!animation)tick()});dustObserver.observe(canvas);
    addEventListener('resize',()=>{seed();draw()});
    reduce.addEventListener?.('change',()=>{if(reduce.matches){cancelAnimationFrame(animation);animation=0;draw()}else if(visible&&!animation)tick()});
  }
  updateScroll();
})();
