
// Load the JSON list of archived files
async function loadArchiveList(){
  try {
    const res = await fetch('newsletters.json');
    const newsletters = await res.json();
    const select = document.getElementById('archiveSelect');
    newsletters.forEach(n => {
      const opt = document.createElement('option');
      opt.value = n.filename;
      opt.textContent = n.title;
      select.appendChild(opt);
    });
  } catch(err){
    console.error('Error loading archive list:', err);
  }
}

// Load selected newsletter into the editor container
async function loadArchivedEdition(path){
  if(!path) return;
  try{
    const res = await fetch(path);
    const html = await res.text();

    // Replace the current container content
    const container = document.querySelector('.container');
    container.innerHTML = html;

    // Reattach event listeners to new content
    attachEvents();
  }catch(err){
    alert('Error loading newsletter: '+err.message);
  }
}

// Call this on page load
window.addEventListener('DOMContentLoaded', loadArchiveList);


/* ------------------- HELPERS ------------------- */
function attachEvents(){
  // Remove buttons
  document.querySelectorAll('.remove-btn').forEach(btn => { 
    btn.onclick = () => removeElement(btn); 
  });

  // Add buttons
  document.querySelectorAll('.add-btn').forEach(btn => {
    if(btn.innerText.includes("Article")) btn.onclick = addMainArticle;
    if(btn.innerText.includes("Panel")) btn.onclick = addSidePanel;
  });

  // Plain text paste for all contenteditables
  document.querySelectorAll('[contenteditable="true"]').forEach(el => {
  el.addEventListener('paste', function(e) {
    e.preventDefault(); // stop default paste behavior

    // Get plain text from clipboard
    const text = (e.clipboardData || window.clipboardData).getData('text');
    if (!text) return;

    // Insert text at cursor as plain text
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);

    // Remove selected text if any
    range.deleteContents();

    // Insert plain text
    range.insertNode(document.createTextNode(text));

    // Move cursor to the end of inserted text
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  });
});

}


function getEditorContent(){ return document.querySelector('.sheet').outerHTML; }
function setEditorContent(html){
  const container = document.querySelector('.container');
  container.innerHTML = html;
  attachEvents();
}



function makeImageResizable(container) {
  const img = container.querySelector('img'); // find img inside container

  // Create a resize handle
  const handle = document.createElement('div');
  handle.className = 'resizer';
  container.style.position = 'relative';
  handle.style.position = 'absolute';
  handle.style.right = '0';
  handle.style.bottom = '0';
  handle.style.width = '12px';
  handle.style.height = '12px';
  handle.style.cursor = 'se-resize';
  handle.style.background = 'repeating-linear-gradient(135deg, #999, #999 2px, transparent 2px, transparent 4px)';
  handle.style.opacity = '0.6';
  handle.style.borderRadius = '2px';
  container.appendChild(handle);

  let startX, startY, startWidth, startHeight;

  handle.addEventListener('mousedown', e => {
    e.preventDefault();
    startX = e.clientX;
    startY = e.clientY;
    startWidth = img.offsetWidth;
    startHeight = img.offsetHeight;
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
  });

  function resize(e) {
    const width = startWidth + (e.clientX - startX);
    img.style.width = width + 'px';
    img.style.height = 'auto'; // maintain aspect ratio
  }

  function stopResize() {
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
  }
}


let currentFigure = null; // To remember which figure is being edited

async function addImage() {
  const mainCol = document.getElementById('mainColumn');
  const figure = document.createElement('figure');
  figure.classList.add('figure');

  // Add placeholder image and caption
  figure.innerHTML = `
    <button class="remove-btn">X Remove</button>
    <img src="images/placeholder.png" alt="New Image">
    <figcaption contenteditable="true" class="caption">[Caption]</figcaption>
  `;

  makeImageResizable(figure);


  mainCol.insertBefore(figure, mainCol.querySelector('.add-btn'));
  attachEvents();

  // Remember this figure for the modal
  currentFigure = figure;

  // Open modal to pick actual image
  openImagePicker();
}

async function openImagePicker() {
  const modal = document.getElementById('imagePickerModal');
  const grid = document.getElementById('imagePickerGrid');
  grid.innerHTML = '';

  try {
    const res = await fetch('images.json');
    if (!res.ok) throw new Error('Could not fetch images.json');
    const images = await res.json();

    images.forEach(path => {
      const div = document.createElement('div');
      div.style.cursor = 'pointer';
      div.style.textAlign = 'center';
      div.style.width = '100px';
      div.innerHTML = `
        <img src="${path}" style="width:100px;height:70px;object-fit:cover;border:1px solid #ccc;border-radius:4px;">
        <div style="font-size:12px;margin-top:4px;word-break:break-word">${path.split('/').pop()}</div>
      `;

      // **Important:** set image AND auto-caption when clicked
      div.onclick = () => {
        if (currentFigure) {
          currentFigure.querySelector('img').src = path;

          // Generate caption from filename
          let caption = path.split('/').pop()          // get filename
                            .replace(/[-_]/g,' ')     // replace dashes/underscores
                            .replace(/\.\w+$/, '');   // remove extension
          caption = caption.charAt(0).toUpperCase() + caption.slice(1); // capitalize first letter

          currentFigure.querySelector('figcaption').textContent = caption;
        }
        closeImagePicker();
      };

      grid.appendChild(div);
    });

    modal.style.display = 'flex';
  } catch (err) {
    console.error(err);
    alert('Failed to load images. Check console for details.');
  }
}

function closeImagePicker() {
  document.getElementById('imagePickerModal').style.display = 'none';
  currentFigure = null;
}



/* ------------------- FILE HANDLING ------------------- */
function newFile(){ if(confirm("Start a new newsletter? Unsaved changes will be lost.")){ location.reload(); } }

function previewFile(){
  const content = getEditorContent();
  localStorage.setItem('previewNewsletter', content);
  window.open('preview.html','_blank');
}

/* Save as file: html or json */
function saveEditionAsFile(format='html'){
  const sheet = document.querySelector('.sheet');
  const title = sheet.querySelector('.title')?.textContent.trim() || 'Newsletter';
  let content;
  if(format==='json'){
    const mainArticles = Array.from(sheet.querySelectorAll('.main-col .card, .main-col .lead')).map(card=>({
      title: card.querySelector('h1')?.textContent || '',
      byline: card.querySelector('.byline')?.textContent || '',
      lede: card.querySelector('.lede')?.textContent || '',
      article: card.querySelector('.article')?.innerHTML || ''
    }));
    const sidePanels = Array.from(sheet.querySelectorAll('.side-col .card-aside')).map(panel=>({
      title: panel.querySelector('h4')?.textContent || '',
      content: panel.querySelector('.small')?.innerHTML || ''
    }));
    content = JSON.stringify({
      masthead:{
        title: sheet.querySelector('.title')?.textContent || '',
        strapline: sheet.querySelector('.strapline')?.textContent || '',
        editionMeta: Array.from(sheet.querySelectorAll('.edition-meta span')).map(s=>s.textContent)
      },
      mainArticles,
      sidePanels,
      footer: Array.from(sheet.querySelectorAll('.folio div')).map(d=>d.textContent)
    }, null, 2);
  } else {
    content = sheet.outerHTML;
  }
  const blob = new Blob([content], {type: format==='json'?'application/json':'text/html'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${title.replace(/\s+/g,'_')}.${format}`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* Load from file input */
function loadEditionFromFile(event){
  const file = event.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = e=>{
    try{
      if(file.name.endsWith('.json')) loadFromJSON(JSON.parse(e.target.result));
      else setEditorContent(e.target.result);
    }catch(err){ alert('Error loading file: '+err.message); }
  };
  reader.readAsText(file);
}

/* Load JSON data into editor */
function loadFromJSON(data){
  const mainCol = document.getElementById('mainColumn');
  const sideCol = document.getElementById('sideColumn');

  mainCol.querySelectorAll('.card,.lead').forEach(el=>el.remove());
  sideCol.querySelectorAll('.card-aside').forEach(el=>el.remove());

  document.querySelector('.title').textContent = data.masthead.title||'';
  document.querySelector('.strapline').textContent = data.masthead.strapline||'';
  const metaSpans = document.querySelectorAll('.edition-meta span');
  data.masthead.editionMeta.forEach((text,i)=>{ if(metaSpans[i]) metaSpans[i].textContent=text; });

  data.mainArticles.forEach(article=>{
    const sec=document.createElement('section');
    sec.classList.add('card');
    sec.innerHTML=`
      <button class="remove-btn">X Remove</button>
      <h1 contenteditable="true">${article.title}</h1>
      <div class="byline" contenteditable="true">${article.byline}</div>
      <div class="lede" contenteditable="true">${article.lede}</div>
      <div class="article dropcap goof" contenteditable="true">${article.article}</div>`;
    mainCol.insertBefore(sec, mainCol.querySelector('.add-btn'));
  });

  data.sidePanels.forEach(panel=>{
    const div=document.createElement('div');
    div.classList.add('card-aside');
    div.innerHTML=`
      <button class="remove-btn">X Remove</button>
      <h4 contenteditable="true">${panel.title}</h4>
      <div class="small" contenteditable="true">${panel.content}</div>`;
    sideCol.insertBefore(div, sideCol.querySelector('.add-btn'));
  });

  attachEvents();
  alert('📂 Edition loaded from file');
}

/* ------------------- ADD / REMOVE ------------------- */
function addMainArticle(){
  const mainCol=document.getElementById('mainColumn');
  const sec=document.createElement('section');
  sec.classList.add('card');
  sec.innerHTML=`
    <button class="remove-btn">X Remove</button>
    <h1 contenteditable="true">[New Article Title]</h1>
    <div class="byline" contenteditable="true">By [Author Name]</div>
    <div class="lede" contenteditable="true">[Lead paragraph placeholder]</div>
    <div class="article dropcap bang" contenteditable="true"><p>[Main article content placeholder]</p></div>`;
  mainCol.insertBefore(sec, mainCol.querySelector('.add-btn'));
  attachEvents();
}

function addSidePanel(){
  const sideCol=document.getElementById('sideColumn');
  const div=document.createElement('div');
  div.classList.add('card-aside');
  div.innerHTML=`
    <button class="remove-btn">X Remove</button>
    <h4 contenteditable="true">[New Side Panel Title]</h4>
    <div class="small" contenteditable="true">[Side panel content placeholder]</div>`;
  sideCol.insertBefore(div, sideCol.querySelector('.add-btn'));
  attachEvents();
}

function removeElement(btn){
  if(confirm("Remove this section?")) btn.parentElement.remove();
}

/* ------------------- INIT ------------------- */
attachEvents();


